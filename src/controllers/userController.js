import { log } from '../utils/logger.js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config()

import UserService from '../services/userService.js'
import {
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
  Blacklist,
} from '../models/index.js'

const userService = new UserService(
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
  Blacklist
)

// Create a separate function for reCAPTCHA verification that can be mocked in tests
export const verifyCaptcha = async (captchaResponse) => {
  // Skip verification in test environment
  if (process.env.NODE_ENV === 'test' && captchaResponse === 'test-bypass-captcha') {
    return { success: true }
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`
  console.log('Constructed verifyUrl in controller:', verifyUrl)
  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: { Connection: 'close' },
  })
  console.log('Fetch call completed')
  return verifyResponse.json()
}

// Login function
const login = async (req, res) => {
  try {
    const { email, password, captchaResponse } = req.body // Get captchaResponse

    // --- reCAPTCHA Verification (BEFORE calling the service) ---
    if (!captchaResponse) {
      log.warn(`Login attempt failed: Missing CAPTCHA response for ${email || 'unknown user'}`)
      return res.status(400).json({ message: 'CAPTCHA response is required' })
    }

    const verifyData = await verifyCaptcha(captchaResponse)
    console.log('reCAPTCHA Verification Data:', verifyData)

    if (!verifyData.success) {
      log.warn(`Login attempt failed: CAPTCHA verification failed for ${email || 'unknown user'}`, {
        error: verifyData['error-codes'] || 'No specific error codes provided',
        score: verifyData.score,
        requestUrl: `https://www.google.com/recaptcha/api/siteverify?secret=[REDACTED]&response=${captchaResponse?.substring(0, 20)}...`,
        captchaLength: captchaResponse ? captchaResponse.length : 0,
        errorDetails: JSON.stringify(verifyData),
      })
      console.error('reCAPTCHA verification failed:', verifyData)
      return res.status(400).json({ message: 'CAPTCHA verification failed' })
    }

    const { user, token } = await userService.loginUser(email, password)

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user,
    })
    log.info(`User ${email} logged in successfully`)
  } catch (error) {
    log.error(`Login error for ${req.body.email || 'unknown user'}:`, {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.name,
    })

    if (error.message === 'Invalid credentials') {
      log.warn(
        `Failed login attempt with invalid credentials for ${req.body.email || 'unknown user'}`
      )
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    log.error(`Authentication failed with error: ${error.message}`)
    return res.status(500).json({ message: 'Authentication failed' })
  }
}

const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      birthDate,
      contactNo,
      schoolId,
      userType,
      department,
      section,
      groupId,
    } = req.body
    const user = await userService.createUser(
      email,
      password,
      firstName,
      lastName,
      birthDate,
      contactNo,
      schoolId,
      userType,
      department,
      section,
      groupId
    )

    res.status(201).json({
      message: 'User created successfully',
      user,
    })
    log.info(`User ${email} created successfully`)
  } catch (error) {
    log.error('Create user error:', error)
    if (error.message === 'Email already exists') {
      return res.status(400).json({ message: error.message })
    }
    return res.status(500).json({ message: 'Failed to create user' })
  }
}

const getAllUsers = async (_req, res) => {
  try {
    const users = await userService.getAllUsers()
    res.status(200).json(users)
    log.info('Retrieved all users')
  } catch (error) {
    log.error('Get all users error:', error)
    return res.status(500).json({ message: 'Failed to retrieve users' })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)
    res.status(200).json(user)
  } catch (error) {
    log.error('Get user by ID error:', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(500).json({ message: 'Failed to retrieve user' })
  }
}

const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' })
    }

    await userService.logoutUser(token)

    res.status(200).json({ message: 'User logged out successfully' })
    log.info('User logged out successfully')
  } catch (error) {
    log.error('Logout error:', error)
    return res.status(500).json({ message: 'Logout failed' })
  }
}

export { login, logoutUser, createUser, getAllUsers, getUserById }

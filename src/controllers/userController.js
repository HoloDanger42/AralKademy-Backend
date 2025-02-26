//----
import { log } from '../utils/logger.js'
import fetch from 'node-fetch' // Import node-fetch
import dotenv from 'dotenv'
dotenv.config()
//---

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
  School
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
)

//login function
const login = async (req, res) => {
  try {
    const { email, password, captchaResponse } = req.body // Get captchaResponse

    // --- reCAPTCHA Verification (BEFORE calling the service) ---
    if (!captchaResponse) {
      return res.status(400).json({ message: 'CAPTCHA response is required' })
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`
    console.log('About to make fetch call to:', verifyUrl)
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: { Connection: 'close' },
    })
    console.log('Fetch call completed')
    const verifyData = await verifyResponse.json()

    console.log('reCAPTCHA Verification Data:', verifyData) // ADD THIS

    if (!verifyData.success) {
      console.error('reCAPTCHA verification failed:', verifyData)
      return res.status(400).json({ message: 'CAPTCHA verification failed' })
    }
    // --- End reCAPTCHA Verification ---

    // calling the service, passing email and password (NO captchaResponse)
    const { user, token } = await userService.loginUser(email, password)

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user,
    })
    log.info(`User ${email} logged in successfully`)
  } catch (error) {
    log.error('Login error:', error)
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    return res.status(500).json({ message: 'Authentication failed' })
  }
}
//----

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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    await userService.logoutUser(token);
    
    res.status(200).json({ message: "User logged out successfully" });
    log.info("User logged out successfully");
  } catch (error) {
    log.error("Logout error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};

export { login, logoutUser, createUser, getAllUsers, getUserById }

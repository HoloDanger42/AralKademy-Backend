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
/**
 * Verifies the reCAPTCHA response.
 * @param {string} captchaResponse - The reCAPTCHA response token from the client.
 * @returns {Promise<Object>} - An object containing the verification result.
 */
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
/**
 * Handles user login.
 * @param {Object} req - The request object containing email, password, and captchaResponse.
 * @param {Object} res - The response object.
 */
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

/**
 * Creates a new user.
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object.
 */
const createUser = async (req, res) => {
    console.log('Create user request:', req.body);
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            birth_date,
            contact_no,
            school_id,
            role,
            middle_initial,
        } = req.body;

        const user = await userService.createUser(
            email,
            password,
            first_name,
            last_name,
            birth_date,
            contact_no,
            school_id,
            role,
            middle_initial,
        );

        res.status(201).json({
            message: 'User created successfully',
            user,
        });
        log.info(`User ${email} created successfully`);
    } catch (error) {
        log.error('Create user error:', error);
        console.error(error);
         if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errors: error.errors });
        }
        if (error.message === 'Email already exists') {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: 'Failed to create user' });
    }
};


/**
 * Retrieves all users.
 * @param {Object} _req - The request object (not used).
 * @param {Object} res - The response object.
 */
const getAllUsers = async (_req, res) => {
  try {
        const users = await userService.getAllUsers()
        const usersWithoutPassword = users.rows.map(user => {
            const {
                password,
                ...userWithoutPassword
            } = user.get({
                plain: true
            }); // Convert to plain object
            return userWithoutPassword;
        });

        // Send the modified user data
        res.status(200).json({
            count: users.count,
            users: usersWithoutPassword
        });
        log.info('Retrieved all users');
    } catch (error) {
        log.error('Get all users error:', error)
        return res.status(500).json({
            message: 'Failed to retrieve users'
        })
    }
}

/**
 * Retrieves a user by ID.
 * @param {Object} req - The request object containing the user ID in req.params.
 * @param {Object} res - The response object.
 */
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

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await userService.deleteUser(id);

        if (success) {
            res.status(200).json({ message: 'User deleted successfully' });
             log.info(`User with ID ${id} deleted`);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        log.error('Delete user error:', error);
         if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

/**
 * Logs out a user.
 * @param {Object} req - The request object containing the authorization token in headers.
 * @param {Object} res - The response object.
 */
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

/**
 * Handles forgot password requests.
 * @param {Object} req - The request object containing the user's email.
 * @param {Object} res - The response object.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    await userService.forgotPassword(email)
    res.status(200).json({ message: 'Password reset email sent successfully' })
    log.info(`Password reset email sent to ${email}`)
  } catch (error) {
    log.error('Forgot password error:', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(500).json({ message: 'Failed to send password reset email' })
  }
}

/**
 * Verifies the password reset code.
 * @param {Object} req - The request object containing the user's email and reset code.
 * @param {Object} res - The response object.
 */
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body
    await userService.verifyResetCode(email, code)
    res.status(200).json({ message: 'Code confirmed successfully' })
    log.info(`Code confirmed for ${email}`)
  } catch (error) {
    log.error('Confirm code error:', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' })
    }
    if (error.message === 'Invalid code') {
      return res.status(400).json({ message: 'Invalid code' })
    }
    return res.status(500).json({ message: 'Failed to confirm code' })
  }
}

/**
 * Resets the user's password.
 * @param {Object} req - The request object containing the user's email and new password.
 * @param {Object} res - The response object.
 */
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    await userService.resetPassword(email, password)
    res.status(200).json({ message: 'Password reset successfully' })
    log.info(`Password reset for ${email}`)
  } catch (error) {
    log.error('Reset password error:', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' })
    }
    if (error.message === ('Password must be at least 8 characters')) {
      return res.status(400).json({ message: 'Password must be at least 8 characters'})
    }
    return res.status(500).json({ message: 'Failed to reset password' })
  }
}

export { login, logoutUser, createUser, getAllUsers, getUserById, forgotPassword, verifyResetCode, resetPassword, deleteUser }

import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import config from '../config/config.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { handleControllerError } from '../utils/errorHandler.js'
import { log } from '../utils/logger.js'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import UserService from '../services/userService.js'
import {
  School,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  Blacklist,
} from '../models/index.js'

dotenv.config()

// Initialize user service for authentication operations
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

/**
 * Verifies the reCAPTCHA response.
 * @param {string} captchaResponse - The reCAPTCHA response token from the client.
 * @returns {Promise<Object>} - An object containing the verification result.
 */
export const verifyCaptcha = async (captchaResponse) => {
  // Skip verification in test and development environment
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return { success: true }
  }

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`
  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: { Connection: 'close' },
  })
  return verifyResponse.json()
}

export const AuthController = {
  verifyCaptcha,
  userService,
  /**
   * Handles user login with captcha verification
   * @param {Object} req - The request object containing email, password, and captchaResponse.
   * @param {Object} res - The response object.
   */
  login: asyncHandler(async (req, res) => {
    try {
      const { email, password, captchaResponse } = req.body

      // CAPTCHA verification
      if (!captchaResponse) {
        log.warn(`Login attempt failed: Missing CAPTCHA response for ${email || 'unknown user'}`)
        return res.status(400).json({ message: 'CAPTCHA response is required' })
      }

      const verifyData = await AuthController.verifyCaptcha(captchaResponse)

      if (!verifyData.success) {
        log.warn(
          `Login attempt failed: CAPTCHA verification failed for ${email || 'unknown user'}`,
          {
            error: verifyData['error-codes'] || 'No specific error codes provided',
            score: verifyData.score,
            requestUrl: `https://www.google.com/recaptcha/api/siteverify?secret=[REDACTED]&response=${captchaResponse?.substring(0, 20)}...`,
            captchaLength: captchaResponse ? captchaResponse.length : 0,
            errorDetails: JSON.stringify(verifyData),
          }
        )
        return res.status(400).json({ message: 'CAPTCHA verification failed' })
      }

      const { user, token, refreshToken } = await userService.loginUser(email, password)

      res.status(200).json({
        message: 'Logged in successfully',
        token,
        refreshToken,
        user,
      })
      log.info(`User ${email} logged in successfully`)
    } catch (error) {
      return handleControllerError(
        error,
        res,
        `Login attempt for ${req.body.email || 'unknown user'}`,
        'Authentication failed'
      )
    }
  }),

  /**
   * Logs out a user by invalidating their token.
   * @param {Object} req - The request object containing the authorization token in headers.
   * @param {Object} res - The response object.
   */
  logout: asyncHandler(async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' })
      }

      await userService.logoutUser(token)

      res.status(200).json({ message: 'User logged out successfully' })
      log.info('User logged out successfully')
    } catch (error) {
      return handleControllerError(error, res, 'Logout user', 'Logout failed')
    }
  }),

  /**
   * Refreshes the access token using a valid refresh token.
   * @param {Object} req - The request object containing the refresh token in req.body.
   * @param {Object} res - The response object.
   */
  refreshToken: asyncHandler(async (req, res) => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token is required' })
      }

      // Verify the refresh token
      let decoded
      try {
        decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret)
      } catch (error) {
        log.warn('Invalid refresh token attempt: ', error.message)
        return res.status(401).json({ message: 'Invalid refresh token' })
      }

      // Find the user
      const user = await User.findOne({
        where: {
          id: decoded.id,
          refreshToken: refreshToken, // Only valid if stored token matches provided token
        },
      })

      if (!user) {
        log.warn(`Refresh token used with non-existent user ID: ${decoded.id}`)
        return res.status(401).json({ message: 'Invalid refresh token' })
      }

      // Generate a new access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          nonce: Date.now(),
        },
        config.jwt.accessTokenSecret,
        { expiresIn: config.jwt.accessTokenExpiry }
      )

      // Return the new access token
      log.info(`Token refreshed successfully for user: ${user.id}`)
      return res.json({
        accessToken,
        message: 'Token refreshed successfully',
      })
    } catch (error) {
      return handleControllerError(
        error,
        res,
        'Refresh token',
        'Failed to refresh authentication token'
      )
    }
  }),

  /**
   * Validates an access token.
   * @param {Object} req - The request object containing the user from middleware.
   * @param {Object} res - The response object.
   */
  validateToken: asyncHandler(async (req, res) => {
    try {
      // If middleware passed, token is valid
      return res.status(200).json({
        isValid: true,
        user: {
          id: req.user.userId,
          email: req.user.email,
          role: req.user.role,
        },
      })
    } catch (error) {
      return handleControllerError(error, res, 'Validate token', 'Failed to validate token')
    }
  }),
}

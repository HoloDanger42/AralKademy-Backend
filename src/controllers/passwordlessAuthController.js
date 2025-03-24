import { asyncHandler } from '../utils/asyncHandler.js'
import { handleControllerError } from '../utils/errorHandler.js'
import { log } from '../utils/logger.js'
import passwordlessAuthService from '../services/passwordlessAuthService.js'
import e from 'express'

export const PasswordlessAuthController = {
  /**
   * Request a magic link for passwordless login (teachers/admins)
   */
  requestMagicLink: asyncHandler(async (req, res) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({
          error: {
            message: 'Email is required',
          },
        })
      }

      await passwordlessAuthService.generateMagicLink(email)

      res.status(200).json({
        message: 'Login link sent to your email',
      })

      log.info(`Magic link sent to ${email}`)
    } catch (error) {
      return handleControllerError(
        error,
        res,
        `Magic link request fro ${req.body.email || 'unknown'}`,
        'Failed to generate magic link'
      )
    }
  }),

  /**
   * Request a numeric code for student login (grades 4-6)
   */
  requestNumericCode: asyncHandler(async (req, res) => {
    try {
      const { identifier } = req.body

      if (!identifier) {
        return res.status(400).json({ error: { message: 'Student ID or username is required' } })
      }

      const { code, qrCode } = await passwordlessAuthService.generateNumericCode(identifier)

      res.status(200).json({
        message: 'Login code generated successfully',
        code,
        qrCode,
      })

      log.info(`Numeric code generated for student identifier: ${identifier}`)
    } catch (error) {
      return handleControllerError(
        error,
        res,
        `Numeric code request for ${req.body.identifier || 'unknown'}`,
        'Failed to generate numeric code'
      )
    }
  }),

  /**
   * Request a picture code for youngest students (grades 1-3)
   */
  requestPictureCode: asyncHandler(async (req, res) => {
    try {
      const { identifier } = req.body

      if (!identifier) {
        return res.status(400).json({ error: { message: 'Student ID or username is required' } })
      }

      const { pictureCode, pictures } =
        await passwordlessAuthService.generatePictureCode(identifier)

      res.status(200).json({
        message: 'Picture code generated successfully',
        pictureCode,
        pictures,
      })

      log.info(`Picture code generated for student identifier: ${identifier}`)
    } catch (error) {
      return handleControllerError(
        error,
        res,
        `Picture code request for ${req.body.identifier || 'unknown'}`,
        'Failed to generate picture code'
      )
    }
  }),

  /**
   * Verify token (any type) and login user
   */
  verifyToken: asyncHandler(async (req, res) => {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({ error: { message: 'Token is required' } })
      }

      const authResult = await passwordlessAuthService.verifyToken(token)

      res.status(200).json({
        message: 'Login successful',
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        user: authResult.user,
      })

      log.info(`User ${authResult.user.email} logged in with passwordless auth`)
    } catch (error) {
      return handleControllerError(
        error,
        res,
        'Token verification',
        'Invalid or expired login token'
      )
    }
  }),
}

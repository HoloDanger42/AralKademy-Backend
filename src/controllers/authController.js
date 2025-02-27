import jwt from 'jsonwebtoken'
import { User } from '../models/index.js'
import config from '../config/config.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const AuthController = {
  refreshToken: asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token is required' })
    }

    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshTokenSecret)

      try {
        // Find the user
        const user = await User.findOne({
          where: {
            id: decoded.userId,
            refreshToken: refreshToken, // Only valid if stored token matches provided token
          },
        })

        if (!user) {
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
        console.log('Received refresh token:', req.body.refreshToken)
        return res.json({
          accessToken,
          message: 'Token refreshed successfully',
        })
      } catch (dbError) {
        // Pass database errors to error handler middleware
        return next(dbError)
      }
    } catch (tokenError) {
      // Handle token verification errors
      return res.status(401).json({ message: 'Invalid refresh token' })
    }
  }),
}

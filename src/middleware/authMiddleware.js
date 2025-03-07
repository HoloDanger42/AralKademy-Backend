import jwt from 'jsonwebtoken'
import { User, Blacklist } from '../models/index.js'
import { log } from '../utils/logger.js'
import { UnauthorizedError } from '../utils/errors.js'

const authMiddleware = async (req, _res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.warn('No token present or incorrect format')
      throw new UnauthorizedError('No token provided or incorrect format', 'NO_TOKEN_PROVIDED')
    }

    const token = authHeader.split(' ')[1]

    // Check if token is blacklisted
    const blacklistedToken = await Blacklist.findOne({ where: { token } })
    if (blacklistedToken) {
      throw new UnauthorizedError('Token has been revoked', 'TOKEN_REVOKED')
    }

    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

      const user = await User.findOne({ where: { email: decodedToken.email } })
      if (!user) {
        log.warn('User not found for token')
        throw new UnauthorizedError('User associated with token not found', 'USER_NOT_FOUND')
      }

      req.user = user
      next()
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired', 'TOKEN_EXPIRED')
      }
      if (tokenError.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token', 'INVALID_TOKEN')
      }
      throw tokenError
    }
  } catch (error) {
    // Let the main error middleware handle the error
    next(error)
  }
}

export { authMiddleware }

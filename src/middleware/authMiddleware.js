import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { log } from '../utils/logger.js'

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.warn('No token present or incorrect format')
      return res.status(401).json({
        message: 'Unauthorized: No token provided or incorrect format',
      })
    }

    const token = authHeader.split(' ')[1]

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findOne({ where: { email: decodedToken.email } })
    if (!user) {
      log.warn('User not found')
      return res.status(401).json({
        message: 'Unauthorized: Invalid Token',
      })
    }

    req.user = user
    next()
  } catch (error) {
    log.error(error)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Unauthorized: Token Expired',
      })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Unauthorized: Invalid Token',
      })
    }
    return res.status(500).json({
      message: 'Something went wrong during authentication',
    })
  }
}

export { authMiddleware }

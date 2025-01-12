import { log } from '../utils/logger.js'

const errorMiddleware = (err, req, res, _next) => {
  log.error(`Error: ${err.message}`, {
    stack: err.stack,
    headers: req.headers,
    body: req.body,
  })

  if (err instanceof SpecificError) {
    return res.status(err.statusCode || 500).json({ message: err.message })
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'That already exists in our system, please try something else',
    })
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.message })
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Unauthorized: Invalid Token' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Unauthorized: Token Expired' })
  }

  return res.status(500).json({ message: 'Oops, something went wrong.' })
}

class SpecificError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.name = 'SpecificError'
  }
}

export { errorMiddleware, SpecificError }

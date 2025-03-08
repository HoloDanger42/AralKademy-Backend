import { log } from '../utils/logger.js'
import { AppError } from '../utils/errors.js'

/**
 * Centralized error handling middleware
 */
const errorMiddleware = (err, req, res, _next) => {
  // Log the error with request context
  log.error(`Error: ${err.message}`, {
    errorName: err.name,
    statusCode: err.statusCode || err.status || 500,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body,
    headers: req.headers,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  })

  // If it's a custom AppError, use its properties
  if (err instanceof AppError) {
    const response = {
      error: {
        message: err.message,
        code: err.errorCode,
      },
    }

    // Add validation errors if present
    if (err.errors) {
      response.error.details = err.errors
    }

    return res.status(err.statusCode).json(response)
  }

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = {}
    err.errors.forEach((error) => {
      errors[error.path] = error.message
    })

    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    })
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      },
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED',
      },
    })
  }

  // Handle 404 errors
  if (err.status === 404) {
    return res.status(404).json({
      error: {
        message: err.message || 'Resource not found',
        code: 'NOT_FOUND',
      },
    })
  }

  // Any other error should be treated as a 500 server error
  const statusCode = err.status || err.statusCode || 500
  return res.status(statusCode).json({
    error: {
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message || 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  })
}

// Export error middleware and legacy SpecificError for backward compatibility
class SpecificError extends AppError {
  constructor(message, statusCode, details) {
    super(message, statusCode)
    this.name = 'SpecificError'
    this.details = details
  }
}

export { errorMiddleware, SpecificError }

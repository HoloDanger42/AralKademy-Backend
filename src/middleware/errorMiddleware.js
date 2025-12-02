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

  // Handle SpecificError first to ensure details are captured
  if (err.name === 'SpecificError') {
    // Extract validation errors from the SpecificError
    const validationErrors = Array.isArray(err.details) ? err.details : []

    // Format them into a more user-friendly structure
    const formattedErrors = {}
    validationErrors.forEach((error) => {
      if (error.path && error.path.length > 0) {
        const field = error.path[error.path.length - 1]
        // Transform field names and error messages to be more user-friendly
        formattedErrors[field] = formatValidationMessage(field, error.message)
      }
    })

    return res.status(err.statusCode || 400).json({
      error: {
        message: err.message || 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
    })
  }

  // Then handle other custom AppErrors
  if (err instanceof AppError) {
    const response = {
      error: {
        message: err.message,
        code: err.errorCode,
      },
    }

    // Add validation errors if present (assuming AppError might use 'errors')
    if (err.errors) {
      // Format the error messages if they exist
      const formattedErrors = {}
      Object.entries(err.errors).forEach(([field, message]) => {
        formattedErrors[field] = formatValidationMessage(field, message)
      })
      response.error.details = formattedErrors
    }

    return res.status(err.statusCode).json(response)
  }

  // Handle Sequelize errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = {}
    err.errors.forEach((error) => {
      // Format the Sequelize error messages
      errors[error.path] = formatValidationMessage(error.path, error.message)
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

/**
 * Format validation error messages to be more user-friendly
 * @param {string} field - The field name that has a validation error
 * @param {string} message - The original error message
 * @returns {string} A user-friendly error message
 */
function formatValidationMessage(field, message) {
  // Replace snake_case or camelCase with spaces and capitalize first letter
  const readableField = field
    .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

  // Handle specific field errors with custom messages
  const fieldErrorMap = {
    'duration_minutes': {
      'must be greater than or equal to 1': 'Duration must be at least 1 minute'
    },
    // Add more field-specific messages as needed
  };

  // Check if we have a specific message for this field and error
  if (fieldErrorMap[field]) {
    for (const [errorPattern, customMessage] of Object.entries(fieldErrorMap[field])) {
      if (message.includes(errorPattern)) {
        return customMessage;
      }
    }
  }

  // Generic message transformation
  // Remove quotes around field names, transform "must be X" phrases
  let formattedMessage = message
    .replace(/"/g, '')
    .replace(`${field} must be`, `${readableField} must be`);
  
  // Additional common message transformations
  formattedMessage = formattedMessage
    .replace('greater than or equal to', 'at least')
    .replace('less than or equal to', 'at most');

  return formattedMessage;
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

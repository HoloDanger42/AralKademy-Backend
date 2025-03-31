import { log } from './logger.js'
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ValidationError,
  AppError,
} from './errors.js'

/**
 * Centralized error handler for controllers
 *
 * @param {Error} error - The error object
 * @param {Response} res - Express response object
 * @param {string} context - Context for logging (e.g., 'Create course', 'Update user')
 * @param {string} [defaultMessage='An error occurred'] - Default message to return if not handled specifically
 * @returns {Response} Express response with appropriate status and error details
 */
export const handleControllerError = (
  error,
  res,
  context,
  defaultMessage = 'An error occurred'
) => {
  // Log the error with context
  log.error(`${context} error:`, error)

  // If it's a custom error type, pass it to the error middleware
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.errorCode,
        ...(error.errors && { details: error.errors }),
      },
    })
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const errors = {}
    error.errors.forEach((err) => {
      errors[err.path] = err.message
    })
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      },
    })
  }

  // Handle unique constaint violations
  if (error.name === 'SequelizeUniqueConstraintError') {
    const errors = {}
    error.errors.forEach((err) => {
      errors[err.path] = `${err.path.charAt(0).toUpperCase() + err.path.slice(1)} already exists.`
    })
    return res.status(409).json({
      error: {
        message: 'Resource already exists',
        code: 'CONFLICT',
        details: errors,
      },
    })
  }

  // Handle specific known error messages
  if (error.message === 'Not found' || error.message.includes('not found')) {
    return res.status(404).json({
      error: {
        message: error.message,
        code: 'NOT_FOUND',
      },
    })
  }

  if (
    error.message === 'Unauthorized' ||
    error.message.includes('unauthorized') ||
    error.message === 'Invalid or expired token'
  ) {
    return res.status(401).json({
      error: {
        message: error.message,
        code: 'UNAUTHORIZED',
      },
    })
  }

  if (
    error.message.includes('permission') ||
    error.message.toLowerCase().includes('unauthorized submission')
  ) {
    return res.status(403).json({
      error: {
        message: error.message,
        code: 'FORBIDDEN',
      },
    })
  }

  if (error.message === 'Invalid credentials') {
    return res.status(401).json({
      error: {
        message: 'Invalid credentials',
        code: 'UNAUTHORIZED',
      },
    })
  }

  if (error.message === 'Cannot delete assessment with existing submissions') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: error.message,
      },
    })
  }

  if (error.message === 'Email already exists') {
    return res.status(409).json({
      error: {
        message: 'Resource already exists',
        code: 'CONFLICT',
        details: 'Email already exists',
      },
    })
  }

  // Handle custom validation errors from services
  if (
    error.message.toLowerCase().includes('required') ||
    error.message.toLowerCase().includes('invalid') ||
    error.message.toLowerCase().includes('must be') ||
    error.message.toLowerCase().includes('too long') ||
    error.message.toLowerCase().includes('expired')
  ) {
    return res.status(400).json({
      error: {
        message: error.message,
        code: 'VALIDATION_ERROR',
      },
    })
  }

  // Fallback to generic server error
  return res.status(500).json({
    error: {
      message: defaultMessage,
      code: 'INTERNAL_ERROR',
    },
  })
}

/**
 * Helper to create validation errors for controllers
 *
 * @param {Object} errors - Object with field names as keys and error messages as values
 * @param {string} [message='Validation failed'] - The main error message
 * @returns {ValidationError} A validation error object
 */
export const createValidationError = (errors, message = 'Validation failed') => {
  return new ValidationError(message, errors)
}

/**
 * Helper to create not found errors
 *
 * @param {string} resource - The resource type that wasn't found
 * @param {string|number} identifier - The identifier that was used to look up the resource
 * @returns {NotFoundError} A not found error
 */
export const createNotFoundError = (resource, identifier) => {
  return new NotFoundError(`${resource} with ID ${identifier} not found`)
}

import { log } from './logger.js'

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

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      errors: { [error.path || 'name']: error.message },
    })
  }

  // Handle Sequelize validation errors
  if (error.name === 'SequelizeValidationError') {
    const errors = {}
    error.errors.forEach((err) => {
      errors[err.path] = err.message
    })
    return res.status(400).json({ errors })
  }

  // Handle unique constaint violations
  if (error.name === 'SequelizeUniqueConstraintError') {
    const errors = {}
    error.errors.forEach((err) => {
      errors[err.path] = `${err.path.charAt(0).toUpperCase() + err.path.slice(1)} already exists.`
    })
    return res.status(409).json({ errors })
  }

  // Handle specific known error messages
  if (error.message === 'Not found' || error.message.includes('not found')) {
    return res.status(404).json({ message: error.message })
  }

  if (error.message === 'Unauthorized' || error.message.includes('permission')) {
    return res.status(403).json({ message: error.message })
  }

  if (error.message === 'Invalid credentials') {
    return res.status(401).json({ message: error.message })
  }

  // Handle custom validation errors from services
  if (
    error.message.includes('required') ||
    error.message.includes('invalid') ||
    error.message.includes('must be') ||
    error.message.includes('too long')
  ) {
    return res.status(400).json({ message: error.message })
  }

  // Default server error
  return res.status(500).json({ message: defaultMessage })
}

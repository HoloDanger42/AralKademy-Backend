import { log } from './logger.js'

/**
 * Base class for all application errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.errorCode = errorCode
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * 400 - Bad Request errors (client sent invalid data)
 */
class BadRequestError extends AppError {
  constructor(message = 'Invalid request data', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode)
  }
}

/**
 * 401 - Unauthorized errors (authentication issues)
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode)
  }
}

/**
 * 403 - Forbidden errors (authorization issues)
 */
class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action',
    errorCode = 'FORBIDDEN'
  ) {
    super(message, 403, errorCode)
  }
}

/**
 * 404 - Not Found errors (resource does not exist)
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode)
  }
}

/**
 * 409 - Conflict errors (resource already exists)
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode = 'CONFLICT') {
    super(message, 409, errorCode)
  }
}

/**
 * 422 - Validation errors (data failed validation)
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = {}, errorCode = 'VALIDATION_ERROR') {
    super(message, 422, errorCode)
    this.errors = errors
  }
}

/**
 * 429 - Rate limit errors
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', errorCode = 'RATE_LIMIT') {
    super(message, 429, errorCode)
  }
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
}

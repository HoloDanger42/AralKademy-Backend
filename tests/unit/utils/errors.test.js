import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
} from '../../../src/utils/errors.js'

describe('Error Classes', () => {
  describe('AppError', () => {
    test('should create an error with default values', () => {
      const error = new AppError('Test message')
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('AppError')
      expect(error.message).toBe('Test message')
      expect(error.statusCode).toBe(500)
      expect(error.errorCode).toBe('INTERNAL_ERROR')
    })

    test('should create an error with custom values', () => {
      const error = new AppError('Custom message', 418, 'TEAPOT')
      expect(error.message).toBe('Custom message')
      expect(error.statusCode).toBe(418)
      expect(error.errorCode).toBe('TEAPOT')
    })
  })

  describe('BadRequestError', () => {
    test('should create a 400 error with default values', () => {
      const error = new BadRequestError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('BadRequestError')
      expect(error.message).toBe('Invalid request data')
      expect(error.statusCode).toBe(400)
      expect(error.errorCode).toBe('BAD_REQUEST')
    })

    test('should create a 400 error with custom message', () => {
      const error = new BadRequestError('Missing fields')
      expect(error.message).toBe('Missing fields')
      expect(error.statusCode).toBe(400)
      expect(error.errorCode).toBe('BAD_REQUEST')
    })

    test('should create a 400 error with custom errorCode', () => {
      const error = new BadRequestError('Missing fields', 'INVALID_FIELDS')
      expect(error.message).toBe('Missing fields')
      expect(error.errorCode).toBe('INVALID_FIELDS')
    })
  })

  describe('UnauthorizedError', () => {
    test('should create a 401 error with default values', () => {
      const error = new UnauthorizedError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('UnauthorizedError')
      expect(error.message).toBe('Authentication required')
      expect(error.statusCode).toBe(401)
      expect(error.errorCode).toBe('UNAUTHORIZED')
    })

    test('should create a 401 error with custom values', () => {
      const error = new UnauthorizedError('Invalid token', 'INVALID_TOKEN')
      expect(error.message).toBe('Invalid token')
      expect(error.errorCode).toBe('INVALID_TOKEN')
    })
  })

  describe('ForbiddenError', () => {
    test('should create a 403 error with default values', () => {
      const error = new ForbiddenError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('ForbiddenError')
      expect(error.message).toBe('You do not have permission to perform this action')
      expect(error.statusCode).toBe(403)
      expect(error.errorCode).toBe('FORBIDDEN')
    })
  })

  describe('NotFoundError', () => {
    test('should create a 404 error with default values', () => {
      const error = new NotFoundError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('Resource not found')
      expect(error.statusCode).toBe(404)
      expect(error.errorCode).toBe('NOT_FOUND')
    })
  })

  describe('ConflictError', () => {
    test('should create a 409 error with default values', () => {
      const error = new ConflictError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('ConflictError')
      expect(error.message).toBe('Resource conflict')
      expect(error.statusCode).toBe(409)
      expect(error.errorCode).toBe('CONFLICT')
    })
  })

  describe('ValidationError', () => {
    test('should create a 422 error with default values', () => {
      const error = new ValidationError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(422)
      expect(error.errorCode).toBe('VALIDATION_ERROR')
      expect(error.errors).toEqual({})
    })

    test('should create a 422 error with custom errors object', () => {
      const errorDetails = { email: 'Invalid email format' }
      const error = new ValidationError('Form validation failed', errorDetails)
      expect(error.message).toBe('Form validation failed')
      expect(error.errors).toEqual(errorDetails)
    })
  })

  describe('RateLimitError', () => {
    test('should create a 429 error with default values', () => {
      const error = new RateLimitError()
      expect(error).toBeInstanceOf(AppError)
      expect(error.name).toBe('RateLimitError')
      expect(error.message).toBe('Too many requests')
      expect(error.statusCode).toBe(429)
      expect(error.errorCode).toBe('RATE_LIMIT')
    })
  })
})

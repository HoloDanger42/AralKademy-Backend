import { afterEach, beforeEach, expect, jest } from '@jest/globals'
import { errorMiddleware, SpecificError } from '../../../src/middleware/errorMiddleware.js'
import { log } from '../../../src/utils/logger.js'

describe('Error Middleware', () => {
  let mockReq
  let mockRes
  let nextFunction

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    nextFunction = jest.fn()
    jest.spyOn(log, 'error')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should handle SpecificError', () => {
    const error = new SpecificError('Custom error', 400)

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(log.error).toHaveBeenCalled()
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Custom error',
        code: 'INTERNAL_ERROR',
      },
    })
  })

  test('should handle SequelizeUniqueConstraintError', () => {
    const error = new Error('Duplicate entry')
    error.name = 'SequelizeUniqueConstraintError'
    error.errors = [
      {
        path: 'email',
        message: 'email must be unique',
      },
    ]

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          email: 'email must be unique',
        },
      },
    })
  })

  test('should handle SequelizeValidationError', () => {
    const error = new Error('Validation failed')
    error.name = 'SequelizeValidationError'
    error.errors = [
      {
        path: 'email',
        message: 'Email is invalid',
      },
    ]

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          email: 'Email is invalid',
        },
      },
    })
  })

  test('should handle JsonWebTokenError', () => {
    const error = new Error('Invalid token')
    error.name = 'JsonWebTokenError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
      },
    })
  })

  test('should handle TokenExpiredError', () => {
    const error = new Error('Token expired')
    error.name = 'TokenExpiredError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Authentication token has expired',
        code: 'TOKEN_EXPIRED',
      },
    })
  })

  test('should handle generic error', () => {
    const error = new Error('Unknown error')

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Unknown error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    })
  })

  test('should log error details', () => {
    const error = new Error('Test error')
    error.stack = 'Error stack trace'

    const originalNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(log.error).toHaveBeenCalledWith(`Error: ${error.message}`, {
      errorName: error.name,
      statusCode: 500,
      path: mockReq.path,
      method: mockReq.method,
      ip: mockReq.ip,
      body: mockReq.body,
      headers: mockReq.headers,
      stack: error.stack,
    })

    // Restore original environment
    process.env.NODE_ENV = originalNodeEnv
  })
})

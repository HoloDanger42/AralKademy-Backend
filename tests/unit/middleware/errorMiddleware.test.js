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
      message: 'Custom error',
    })
  })

  test('should handle SequelizeUniqueConstraintError', () => {
    const error = new Error('Duplicate entry')
    error.name = 'SequelizeUniqueConstraintError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(409)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'That already exists in our system, please try something else',
    })
  })

  test('should handle SequelizeValidationError', () => {
    const error = new Error('Validation failed')
    error.name = 'SequelizeValidationError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Validation failed',
    })
  })

  test('should handle JsonWebTokenError', () => {
    const error = new Error('Invalid token')
    error.name = 'JsonWebTokenError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Unauthorized: Invalid Token',
    })
  })

  test('should handle TokenExpiredError', () => {
    const error = new Error('Token expired')
    error.name = 'TokenExpiredError'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Unauthorized: Token Expired',
    })
  })

  test('should handle generic error', () => {
    const error = new Error('Unknown error')

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(mockRes.status).toHaveBeenCalledWith(500)
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Oops, something went wrong.',
    })
  })

  test('should log error details', () => {
    const error = new Error('Test error')
    error.stack = 'Error stack trace'

    errorMiddleware(error, mockReq, mockRes, nextFunction)

    expect(log.error).toHaveBeenCalledWith(`Error: ${error.message}`, {
      stack: error.stack,
      headers: mockReq.headers,
      body: mockReq.body,
    })
  })
})

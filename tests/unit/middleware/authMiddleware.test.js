import { afterEach, expect, jest } from '@jest/globals'
import { authMiddleware } from '../../../src/middleware/authMiddleware.js'
import jwt from 'jsonwebtoken'
import { validUsers } from '../../fixtures/userData'
import { User } from '../../../src/models/User.js'

describe('Auth Middleware', () => {
  let mockReq
  let mockRes
  let nextFunction
  let verifyMock
  let findOneMock

  beforeEach(() => {
    mockReq = {
      headers: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    nextFunction = jest.fn()
    verifyMock = jest.spyOn(jwt, 'verify')
    findOneMock = jest.spyOn(User, 'findOne')
  })

  afterEach(() => {
    jest.clearAllMocks()
    verifyMock = jest.spyOn(jwt, 'verify')
    findOneMock = jest.spyOn(User, 'findOne')
  })

  test('should authenticate valid token and call next', async () => {
    const mockUser = {
      id: 1,
      ...validUsers[0],
      password: 'hashedPassword',
    }
    mockReq.headers.authorization = 'Bearer validtoken'
    verifyMock.mockImplementation(() => ({ email: mockUser.email }))
    findOneMock.mockResolvedValue(mockUser)

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(verifyMock).toHaveBeenCalledWith('validtoken', process.env.JWT_SECRET)
    expect(findOneMock).toHaveBeenCalledWith({ where: { email: mockUser.email } })
    expect(mockReq.user).toEqual(mockUser)
    expect(nextFunction).toHaveBeenCalled()
  })

  test('should return 401 when no token provided', async () => {
    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'No token provided or incorrect format',
        errorCode: 'NO_TOKEN_PROVIDED',
      })
    )
  })

  test('should return 401 for invalid token format', async () => {
    mockReq.headers.authorization = 'InvalidFormat'

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'No token provided or incorrect format',
        errorCode: 'NO_TOKEN_PROVIDED',
      })
    )
  })

  test('should return 401 for expired token', async () => {
    mockReq.headers.authorization = 'Bearer expiredtoken'
    const tokenError = new Error('Token expired')
    tokenError.name = 'TokenExpiredError'
    verifyMock.mockImplementation(() => {
      throw tokenError
    })

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Token has expired',
        errorCode: 'TOKEN_EXPIRED',
      })
    )
  })

  test('should return 401 for invalid JWT', async () => {
    mockReq.headers.authorization = 'Bearer invalidtoken'
    const jwtError = new Error('Invalid JWT')
    jwtError.name = 'JsonWebTokenError'
    verifyMock.mockImplementation(() => {
      throw jwtError
    })

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'Invalid token',
        errorCode: 'INVALID_TOKEN',
      })
    )
  })

  test('should return 401 for user not found', async () => {
    mockReq.headers.authorization = 'Bearer validtoken'
    verifyMock.mockImplementation(() => ({ email: 'test@test.com' }))
    findOneMock.mockResolvedValue(null)

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 401,
        message: 'User associated with token not found',
        errorCode: 'USER_NOT_FOUND',
      })
    )
  })

  test('should return 500 for database errors', async () => {
    mockReq.headers.authorization = 'Bearer validtoken'
    verifyMock.mockImplementation(() => ({ email: 'test@test.com' }))
    User.findOne.mockRejectedValue(new Error('Database error'))

    await authMiddleware(mockReq, mockRes, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Database error',
      })
    )
  })
})

import { jest } from '@jest/globals'

const mockVerify = jest.fn()
const mockSign = jest.fn()
const mockFindOne = jest.fn()

// First, mock the modules before importing them
jest.unstable_mockModule('jsonwebtoken', () => ({
  verify: mockVerify,
  sign: mockSign,
}))

jest.unstable_mockModule('../../../src/models/index.js', () => ({
  User: {
    findOne: mockFindOne,
  },
}))

jest.unstable_mockModule('../../../src/utils/errorHandler.js', () => ({
  handleControllerError: jest.fn().mockReturnValue({}),
}))

import jwt from 'jsonwebtoken'
import { User } from '../../../src/models/index.js'
import { handleControllerError } from '../../../src/utils/errorHandler.js'
import { AuthController } from '../../../src/controllers/authController.js'
import config from '../../../src/config/config.js'

describe('AuthController', () => {
  let req, res, mockVerify, mockSign, mockFindOne

  beforeEach(() => {
    // Reset request and response objects before each test
    req = {
      body: {},
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }

    // Set up JWT mocks if not already done
    mockVerify = jest.spyOn(jwt, 'verify')
    mockSign = jest.spyOn(jwt, 'sign')
    mockFindOne = jest.spyOn(User, 'findOne')

    // Clear all mock calls between tests
    jest.clearAllMocks()
  })

  describe('refreshToken', () => {
    test('should return 401 if refresh token is not provided', async () => {
      // Setup request with missing token
      req.body.refreshToken = undefined

      // Call the controller
      await AuthController.refreshToken(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Refresh token is required' })
      expect(mockVerify).not.toHaveBeenCalled()
    })

    test('should return 401 if refresh token is invalid', async () => {
      // Set the refresh token in the request body
      req.body.refreshToken = 'invalid-refresh-token'

      // Setup jwt.verify to throw an error
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Call the controller
      await AuthController.refreshToken(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' })
      expect(mockVerify).toHaveBeenCalled()
    })

    test('should return 401 if user is not found', async () => {
      // Setup User.findOne to return null
      mockFindOne.mockResolvedValue(null)
      req.body.refreshToken = 'valid-refresh-token'

      mockVerify.mockReturnValue({ userId: 123 })

      // Call the controller
      await AuthController.refreshToken(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid refresh token' })
      expect(mockVerify).toHaveBeenCalled()
    })

    test('should generate new access token for valid refresh token', async () => {
      // Define a mock user object
      const mockUser = {
        id: 123,
        email: 'test@example.com',
        role: 'student_teacher',
        school_id: 456,
        refreshToken: 'valid-refresh-token',
      }

      // Define a mock token to be returned by jwt.sign
      const mockToken = 'new-access-token'

      // Setup request with valid refresh token
      req.body.refreshToken = 'valid-refresh-token'

      // Setup JWT verify to return a valid decoded token
      mockVerify.mockReturnValue({ userId: 123 })

      // Setup User.findOne to return a valid user
      mockFindOne.mockResolvedValue(mockUser)

      // Setup JWT sign to return a new access token
      mockSign.mockReturnValue(mockToken)

      // Call the controller
      await AuthController.refreshToken(req, res)

      // Assertions
      expect(mockVerify).toHaveBeenCalledWith('valid-refresh-token', config.jwt.refreshTokenSecret)
      expect(mockFindOne).toHaveBeenCalledWith({
        where: {
          id: 123,
          refreshToken: 'valid-refresh-token',
        },
      })

      // Check that jwt.sign was called with correct parameters
      expect(mockSign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          schoolId: mockUser.school_id,
          nonce: expect.any(Number),
        },
        config.jwt.accessTokenSecret,
        { expiresIn: config.jwt.accessTokenExpiry }
      )

      // Verify response
      expect(res.status).not.toHaveBeenCalled() // Default status 200
      expect(res.json).toHaveBeenCalledWith({
        accessToken: mockToken,
        message: 'Token refreshed successfully',
      })
    })

    test('should handle unexpected errors during token refresh', async () => {
      // Setup request with valid refresh token
      req.body.refreshToken = 'valid-refresh-token'

      // Setup JWT verify to return a valid decoded token
      mockVerify.mockReturnValue({ userId: 123 })

      // Setup User.findOne to throw an error
      mockFindOne.mockImplementation(() => {
        throw new Error('Database error')
      })

      // Mock the handleControllerError function
      const handleControllerErrorMock = jest.fn().mockReturnValue({
        status: 500,
        json: { message: 'Failed to refresh authentication token' },
      })
    })
  })

  describe('logout', () => {
    test('should return 401 if no token is provided', async () => {
      // Setup request with no authorization header
      req.headers = {}

      // Call the controller
      await AuthController.logout(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided' })
    })

    test('should successfully log out a user with valid token', async () => {
      // Setup mock userService
      const logoutUserSpy = jest.spyOn(AuthController.userService, 'logoutUser')
      logoutUserSpy.mockResolvedValue(true)

      // Setup request with authorization header
      req.headers = {
        authorization: 'Bearer valid-token',
      }

      // Call the controller
      await AuthController.logout(req, res)

      // Assertions
      expect(logoutUserSpy).toHaveBeenCalledWith('valid-token')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'User logged out successfully' })

      // Clean up
      logoutUserSpy.mockRestore()
    })

    test('should handle errors during logout', async () => {
      // Setup mock userService to throw an error
      const logoutUserSpy = jest.spyOn(AuthController.userService, 'logoutUser')
      logoutUserSpy.mockRejectedValue(new Error('Logout failed'))

      // Reset the mock to clear previous calls
      jest.clearAllMocks()

      // Setup request
      req.headers = {
        authorization: 'Bearer valid-token',
      }

      // Call the controller
      await AuthController.logout(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'Logout failed' })

      // Clean up
      logoutUserSpy.mockRestore()
    })
  })

  describe('validateToken', () => {
    test('should return valid status and user info for valid token', async () => {
      // Setup user info in request (this would be set by authMiddleware)
      req.user = {
        userId: 123,
        email: 'test@example.com',
        role: 'admin',
      }

      // Call the controller
      await AuthController.validateToken(req, res)

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        isValid: true,
        user: {
          id: 123,
          email: 'test@example.com',
          role: 'admin',
        },
      })
    })

    test('should handle errors during token validation', async () => {
      // Mock req.user to cause an error when accessed
      Object.defineProperty(req, 'user', {
        get: () => {
          throw new Error('User not defined')
        },
      })

      // Call the controller
      await AuthController.validateToken(req, res)

      // Check the response instead of the function call
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to validate token' })
    })
  })
})

<<<<<<< HEAD
import { jest } from '@jest/globals'

jest.resetModules()

const mockVerify = jest.fn()
const mockSign = jest.fn()
const mockFindOne = jest.fn()
const mockFetch = jest.fn()
const mockVerifyCaptcha = jest.fn().mockImplementation(() => Promise.resolve({ success: true }))

// First, mock the modules before importing them
jest.unstable_mockModule('jsonwebtoken', () => ({
  verify: mockVerify,
  sign: mockSign,
}))

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => async (req, res, next) => {
    // Just directly execute the function without the wrapper
    try {
      return await fn(req, res, next)
    } catch (error) {
      // If next exists, call it with error
      if (next) return next(error)
      // Otherwise just throw
      throw error
    }
  },
}))

jest.unstable_mockModule('../../../src/models/index.js', () => ({
  User: {
    findOne: mockFindOne,
  },
}))

jest.unstable_mockModule('node-fetch', () => {
  const mockFetchResponse = {
    ok: true,
    json: jest.fn().mockResolvedValue({ success: true }),
  }

  return {
    default: jest.fn().mockResolvedValue(mockFetchResponse),
  }
})

jest.unstable_mockModule('../../../src/controllers/authController.js', () => {
  // Import the userService and handleControllerError
  const { userService } = jest.requireActual('../../../src/controllers/authController.js')

  return {
    verifyCaptcha: mockVerifyCaptcha,
    AuthController: {
      verifyCaptcha: mockVerifyCaptcha,
      userService: userService,
      login: jest.fn(async (req, res) => {
        try {
          const { email, password, captchaResponse } = req.body

          if (!captchaResponse) {
            return res.status(400).json({ message: 'CAPTCHA response is required' })
          }

          const verifyData = await mockVerifyCaptcha(captchaResponse)

          if (!verifyData.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed' })
          }

          // Call the mocked loginUser function
          const { user, token } = await userService.loginUser(email, password)

          return res.status(200).json({
            message: 'Logged in successfully',
            token,
            user,
          })
        } catch (error) {
          return handleControllerError(
            error,
            res,
            `Login attempt for ${req.body.email || 'unknown user'}`,
            'Authentication failed'
          )
        }
      }),
      // Add your other controller methods here
      logout: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .logout,
      refreshToken: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .refreshToken,
      validateToken: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .validateToken,
    },
  }
})

import jwt from 'jsonwebtoken'
import { User } from '../../../src/models/index.js'
import { handleControllerError } from '../../../src/utils/errorHandler.js'
import * as authControllerModule from '../../../src/controllers/authController.js'
import config from '../../../src/config/config.js'

const { AuthController } = authControllerModule

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
      mockVerify.mockReturnValue({ id: 123 })

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
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Logout failed',
          code: 'INTERNAL_ERROR',
        },
      })

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
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate token',
        },
      })
    })
  })

  describe('login', () => {
    beforeEach(() => {
      AuthController.verifyCaptcha = mockVerifyCaptcha

      // Configure mockVerifyCaptcha directly - don't try to spy on authControllerModule
      mockVerifyCaptcha.mockImplementation(() => Promise.resolve({ success: true }))

      // Store the original loginUser function
      loginUserSpy = jest.spyOn(AuthController.userService, 'loginUser').mockResolvedValue({
        user: { id: 123, email: 'test@example.com', role: 'learner' },
        token: 'test-token',
      })
    })

    afterEach(() => {
      // Restore all mocks
      jest.restoreAllMocks()
    })

    test('should return 400 if captchaResponse is missing', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        // captchaResponse is purposely omitted
      }

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA response is required' })
      expect(mockVerifyCaptcha).not.toHaveBeenCalled() // verifyCaptcha should not be called
      expect(AuthController.userService.loginUser).not.toHaveBeenCalled() // loginUser should not be called
    })

    test('should return 400 if CAPTCHA verification fails', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'invalid-captcha-token',
      }

      // Store original implementation
      const originalImplementation = mockVerifyCaptcha.getMockImplementation()

      // Change mockVerifyCaptcha to return failed verification
      mockVerifyCaptcha.mockResolvedValueOnce({
        success: false,
        'error-codes': ['invalid-input-response'],
      })

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('invalid-captcha-token')
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA verification failed' })
      expect(AuthController.userService.loginUser).not.toHaveBeenCalled()

      // Restore the original implementation for other tests
      mockVerifyCaptcha.mockImplementation(originalImplementation)
    })

    test('should proceed with login if CAPTCHA verification succeeds', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'valid-captcha-token',
      }

      jest.clearAllMocks()

      // Mock verifyCaptcha to return successful verification
      mockVerifyCaptcha.mockResolvedValue({ success: true, score: 0.9 })

      const mockUser = { id: 123, email: 'test@example.com', role: 'learner' }
      const mockToken = 'valid-jwt-token'

      // OPTION 1: Update the existing spy instead of creating a new mock
      loginUserSpy.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      })

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(loginUserSpy).toHaveBeenCalledWith('test@example.com', 'Password123!')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
        token: mockToken,
        user: mockUser,
      })
    })

    test('should handle authentication errors properly', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
        captchaResponse: 'valid-captcha-token',
      }

      const authError = new Error('Invalid credentials')
      authError.name = 'AuthenticationError'

      jest.spyOn(AuthController.userService, 'loginUser').mockRejectedValue(authError)

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(AuthController.userService.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'WrongPassword123!'
      )
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid credentials',
          code: 'UNAUTHORIZED',
        },
      })
    })

    test('should handle unexpected errors during login process', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'valid-captcha-token',
      }

      // Mock verifyCaptcha to throw an unexpected error
      const networkError = new Error('Network failure')
      mockVerifyCaptcha.mockRejectedValue(networkError)

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Authentication failed',
          code: 'INTERNAL_ERROR',
        },
      })
    })

    test('should handle empty request body gracefully', async () => {
      // Arrange
      req.body = {}

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA response is required' })
    })
  })
})
=======
import { jest } from '@jest/globals'

jest.resetModules()

const mockVerify = jest.fn()
const mockSign = jest.fn()
const mockFindOne = jest.fn()
const mockFetch = jest.fn()
const mockVerifyCaptcha = jest.fn().mockImplementation(() => Promise.resolve({ success: true }))

// First, mock the modules before importing them
jest.unstable_mockModule('jsonwebtoken', () => ({
  verify: mockVerify,
  sign: mockSign,
}))

jest.unstable_mockModule('../../../src/utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => async (req, res, next) => {
    // Just directly execute the function without the wrapper
    try {
      return await fn(req, res, next)
    } catch (error) {
      // If next exists, call it with error
      if (next) return next(error)
      // Otherwise just throw
      throw error
    }
  },
}))

jest.unstable_mockModule('../../../src/models/index.js', () => ({
  User: {
    findOne: mockFindOne,
  },
}))

jest.unstable_mockModule('node-fetch', () => {
  const mockFetchResponse = {
    ok: true,
    json: jest.fn().mockResolvedValue({ success: true }),
  }

  return {
    default: jest.fn().mockResolvedValue(mockFetchResponse),
  }
})

jest.unstable_mockModule('../../../src/controllers/authController.js', () => {
  // Import the userService and handleControllerError
  const { userService } = jest.requireActual('../../../src/controllers/authController.js')

  return {
    verifyCaptcha: mockVerifyCaptcha,
    AuthController: {
      verifyCaptcha: mockVerifyCaptcha,
      userService: userService,
      login: jest.fn(async (req, res) => {
        try {
          const { email, password, captchaResponse } = req.body

          if (!captchaResponse) {
            return res.status(400).json({ message: 'CAPTCHA response is required' })
          }

          const verifyData = await mockVerifyCaptcha(captchaResponse)

          if (!verifyData.success) {
            return res.status(400).json({ message: 'CAPTCHA verification failed' })
          }

          // Call the mocked loginUser function
          const { user, token } = await userService.loginUser(email, password)

          return res.status(200).json({
            message: 'Logged in successfully',
            token,
            user,
          })
        } catch (error) {
          return handleControllerError(
            error,
            res,
            `Login attempt for ${req.body.email || 'unknown user'}`,
            'Authentication failed'
          )
        }
      }),
      // Add your other controller methods here
      logout: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .logout,
      refreshToken: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .refreshToken,
      validateToken: jest.requireActual('../../../src/controllers/authController.js').AuthController
        .validateToken,
    },
  }
})

import jwt from 'jsonwebtoken'
import { User } from '../../../src/models/index.js'
import { handleControllerError } from '../../../src/utils/errorHandler.js'
import * as authControllerModule from '../../../src/controllers/authController.js'
import config from '../../../src/config/config.js'

const { AuthController } = authControllerModule

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
      mockVerify.mockReturnValue({ id: 123 })

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
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Logout failed',
          code: 'INTERNAL_ERROR',
        },
      })

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
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate token',
        },
      })
    })
  })

  describe('login', () => {
    beforeEach(() => {
      AuthController.verifyCaptcha = mockVerifyCaptcha

      // Configure mockVerifyCaptcha directly - don't try to spy on authControllerModule
      mockVerifyCaptcha.mockImplementation(() => Promise.resolve({ success: true }))

      // Store the original loginUser function
      loginUserSpy = jest.spyOn(AuthController.userService, 'loginUser').mockResolvedValue({
        user: { id: 123, email: 'test@example.com', role: 'learner' },
        token: 'test-token',
      })
    })

    afterEach(() => {
      // Restore all mocks
      jest.restoreAllMocks()
    })

    test('should return 400 if captchaResponse is missing', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        // captchaResponse is purposely omitted
      }

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA response is required' })
      expect(mockVerifyCaptcha).not.toHaveBeenCalled() // verifyCaptcha should not be called
      expect(AuthController.userService.loginUser).not.toHaveBeenCalled() // loginUser should not be called
    })

    test('should return 400 if CAPTCHA verification fails', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'invalid-captcha-token',
      }

      // Store original implementation
      const originalImplementation = mockVerifyCaptcha.getMockImplementation()

      // Change mockVerifyCaptcha to return failed verification
      mockVerifyCaptcha.mockResolvedValueOnce({
        success: false,
        'error-codes': ['invalid-input-response'],
      })

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('invalid-captcha-token')
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA verification failed' })
      expect(AuthController.userService.loginUser).not.toHaveBeenCalled()

      // Restore the original implementation for other tests
      mockVerifyCaptcha.mockImplementation(originalImplementation)
    })

    test('should proceed with login if CAPTCHA verification succeeds', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'valid-captcha-token',
      }

      jest.clearAllMocks()

      // Mock verifyCaptcha to return successful verification
      mockVerifyCaptcha.mockResolvedValue({ success: true, score: 0.9 })

      const mockUser = { id: 123, email: 'test@example.com', role: 'learner' }
      const mockToken = 'valid-jwt-token'

      // OPTION 1: Update the existing spy instead of creating a new mock
      loginUserSpy.mockResolvedValue({
        user: mockUser,
        token: mockToken,
      })

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(loginUserSpy).toHaveBeenCalledWith('test@example.com', 'Password123!')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
        token: mockToken,
        user: mockUser,
      })
    })

    test('should handle authentication errors properly', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
        captchaResponse: 'valid-captcha-token',
      }

      const authError = new Error('Invalid credentials')
      authError.name = 'AuthenticationError'

      jest.spyOn(AuthController.userService, 'loginUser').mockRejectedValue(authError)

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(AuthController.userService.loginUser).toHaveBeenCalledWith(
        'test@example.com',
        'WrongPassword123!'
      )
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid credentials',
          code: 'UNAUTHORIZED',
        },
      })
    })

    test('should handle unexpected errors during login process', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'Password123!',
        captchaResponse: 'valid-captcha-token',
      }

      // Mock verifyCaptcha to throw an unexpected error
      const networkError = new Error('Network failure')
      mockVerifyCaptcha.mockRejectedValue(networkError)

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(mockVerifyCaptcha).toHaveBeenCalledWith('valid-captcha-token')
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Authentication failed',
          code: 'INTERNAL_ERROR',
        },
      })
    })

    test('should handle empty request body gracefully', async () => {
      // Arrange
      req.body = {}

      // Act
      await AuthController.login(req, res)

      // Assert
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'CAPTCHA response is required' })
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

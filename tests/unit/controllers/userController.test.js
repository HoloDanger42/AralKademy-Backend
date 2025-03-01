import { afterEach, expect, jest, test } from '@jest/globals'
import * as UserServiceModule from '../../../src/services/userService.js'
import { log } from '../../../src/utils/logger.js'
import { validUsers } from '../../fixtures/userData.js'

// Mock fetch instead of verifyCaptcha
jest.unstable_mockModule('node-fetch', async () => {
  return {
    default: jest.fn(),
  }
})

// Import after mocking
const fetchMock = (await import('node-fetch')).default

let userControllerModule
beforeAll(async () => {
  userControllerModule = await import('../../../src/controllers/userController.js')
})

describe('User Controller', () => {
  let login, getAllUsers, logoutUser
  let mockReq
  let mockRes
  let loginUserSpy
  let getAllUsersSpy
  let logoutUserSpy

  beforeEach(() => {
    login = userControllerModule.login
    getAllUsers = userControllerModule.getAllUsers
    logoutUser = userControllerModule.logoutUser

    // Mock fetch for each test
    fetchMock.mockReset()

    // For success case:
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    })

    // Setup test environment
    process.env.RECAPTCHA_SECRET_KEY = 'test-secret-key'
    mockReq = {
      body: {},
      headers: {},
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    // Setup spies
    loginUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'loginUser')
    getAllUsersSpy = jest.spyOn(UserServiceModule.default.prototype, 'getAllUsers')
    logoutUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'logoutUser')

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.spyOn(log, 'warn')
  })

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('login', () => {
    test('should login user successfully', async () => {
      // Arrange
      const loginData = {
        email: validUsers[0].email,
        password: validUsers[0].password,
        captchaResponse: 'mock-captcha-response',
      }
      mockReq.body = loginData

      // Mock successful captcha verification
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          challenge_ts: '2025-02-27T04:37:34Z',
          hostname: 'localhost',
        }),
      })

      const mockResponse = {
        user: { id: 1, email: loginData.email, role: validUsers[0].role },
        token: 'mockedToken',
      }
      loginUserSpy.mockResolvedValue(mockResponse)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('recaptcha/api/siteverify'),
        expect.objectContaining({
          method: 'POST',
          headers: { Connection: 'close' },
        })
      )
      expect(loginUserSpy).toHaveBeenCalledWith(loginData.email, loginData.password)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
        token: mockResponse.token,
        user: mockResponse.user,
      })
    })

    test('should handle missing CAPTCHA response', async () => {
      // Arrange
      const loginData = {
        email: validUsers[0].email,
        password: validUsers[0].password,
        // captchaResponse is missing
      }
      mockReq.body = loginData

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'CAPTCHA response is required',
      })
      expect(loginUserSpy).not.toHaveBeenCalled()
    })

    test('should handle CAPTCHA verification failure', async () => {
      // Arrange
      const loginData = {
        email: validUsers[0].email,
        password: validUsers[0].password,
        captchaResponse: 'invalid-captcha',
      }
      mockReq.body = loginData

      // Mock failed captcha verification
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: false,
          'error-codes': ['invalid-input-response'],
        }),
      })

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'CAPTCHA verification failed',
      })
      expect(loginUserSpy).not.toHaveBeenCalled()
    })

    test('should handle invalid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
        captchaResponse: 'mock-captcha-response',
      }
      mockReq.body = loginData

      // Mock successful reCAPTCHA verification
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          challenge_ts: '2023-04-01T12:00:00Z',
          'error-codes': ['invalid-input-response'],
        }),
      })

      // Use the exact error message that's checked in the controller
      const error = new Error('Invalid credentials')
      loginUserSpy.mockRejectedValue(error)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(loginUserSpy).toHaveBeenCalledWith(loginData.email, loginData.password)
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle general server errors during login', async () => {
      // Arrange
      const loginData = {
        email: validUsers[0].email,
        password: validUsers[0].password,
        captchaResponse: 'mock-captcha-response',
      }
      mockReq.body = loginData

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          success: true,
          challenge_ts: '2025-02-27T04:37:34Z',
          hostname: 'localhost',
        }),
      })

      // Then mock service error
      const error = new Error('Server is down')
      loginUserSpy.mockRejectedValue(error)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(loginUserSpy).toHaveBeenCalledWith(loginData.email, loginData.password)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication failed' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('logoutUser', () => {
    test('should logout user successfully', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer mockedToken'
      logoutUserSpy.mockResolvedValue()

      // Act
      await logoutUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User logged out successfully' })
      expect(log.info).toHaveBeenCalledWith('User logged out successfully')
    })

    test('should return 401 if no token is provided', async () => {
      // Arrange
      mockReq.headers.authorization = undefined

      // Act
      await logoutUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided' })
    })

    test('should handle errors during logout', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer mockedToken'
      const error = new Error('Logout failed')
      logoutUserSpy.mockRejectedValue(error)

      // Act
      await logoutUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logout failed' })
      expect(log.error).toHaveBeenCalledWith('Logout error:', error)
    })
  })

  describe('getAllUsers', () => {
    test('should return all users successfully', async () => {
      // Arrange
      const mockUsers = validUsers.map((user, index) => ({
        id: index + 1,
        ...user,
      }))

      getAllUsersSpy.mockResolvedValue({
        count: mockUsers.length,
        rows: mockUsers.map((user) => ({
          get: jest.fn().mockReturnValue(user), // Mock Sequelize's get() method
        })),
      })

      // Act
      await getAllUsers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        count: mockUsers.length,
        users: mockUsers.map(({ password, ...rest }) => rest), // Remove passwords
      })
      expect(log.info).toHaveBeenCalled()
    })
  })

  describe('forgotPassword', () => {
    test('should send password reset email successfully', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email }
      jest.spyOn(UserServiceModule.default.prototype, 'forgotPassword').mockResolvedValue()

      // Act
      await userControllerModule.forgotPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Password reset email sent successfully',
      })
      expect(log.info).toHaveBeenCalledWith(`Password reset email sent to ${validUsers[0].email}`)
    })

    test('should return 404 if user is not found', async () => {
      // Arrange
      mockReq.body = { email: 'nonexistent@example.com' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'forgotPassword')
        .mockRejectedValue(new Error('User not found'))

      // Act
      await userControllerModule.forgotPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
    })

    test('should return 500 if an error occurs', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email }
      jest
        .spyOn(UserServiceModule.default.prototype, 'forgotPassword')
        .mockRejectedValue(new Error('Server error'))

      // Act
      await userControllerModule.forgotPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to send password reset email' })
    })
  })

  describe('verifyResetCode', () => {
    test('should verify reset code successfully', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, code: '123456' }
      jest.spyOn(UserServiceModule.default.prototype, 'verifyResetCode').mockResolvedValue()

      // Act
      await userControllerModule.verifyResetCode(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Code confirmed successfully' })
      expect(log.info).toHaveBeenCalledWith(`Code confirmed for ${validUsers[0].email}`)
    })

    test('should return 404 if user is not found', async () => {
      // Arrange
      mockReq.body = { email: 'nonexistent@example.com', code: '123456' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'verifyResetCode')
        .mockRejectedValue(new Error('User not found'))

      // Act
      await userControllerModule.verifyResetCode(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
    })

    test('should return 400 if code is invalid', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, code: 'invalid-code' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'verifyResetCode')
        .mockRejectedValue(new Error('Invalid code'))

      // Act
      await userControllerModule.verifyResetCode(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid code' })
    })

    test('should return 500 if an error occurs', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, code: '123456' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'verifyResetCode')
        .mockRejectedValue(new Error('Server error'))

      // Act
      await userControllerModule.verifyResetCode(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to confirm code' })
    })
  })

  describe('resetPassword', () => {
    test('should reset password successfully', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, password: 'NewPass123' }
      jest.spyOn(UserServiceModule.default.prototype, 'resetPassword').mockResolvedValue()

      // Act
      await userControllerModule.resetPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password reset successfully' })
      expect(log.info).toHaveBeenCalledWith(`Password reset for ${validUsers[0].email}`)
    })

    test('should return 404 if user is not found', async () => {
      // Arrange
      mockReq.body = { email: 'nonexistent@example.com', password: 'NewPass123' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'resetPassword')
        .mockRejectedValue(new Error('User not found'))

      // Act
      await userControllerModule.resetPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
    })

    test('should return 500 if an error occurs', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, password: 'NewPass123' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'resetPassword')
        .mockRejectedValue(new Error('Server error'))

      // Act
      await userControllerModule.resetPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to reset password' })
    })

    test('should return 400 if password is invalid', async () => {
      // Arrange
      mockReq.body = { email: validUsers[0].email, password: 'password' }
      jest
        .spyOn(UserServiceModule.default.prototype, 'resetPassword')
        .mockRejectedValue(new Error('Password must be at least 8 characters'))

      // Act
      await userControllerModule.resetPassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Password must be at least 8 characters',
      })
    })
  })
})

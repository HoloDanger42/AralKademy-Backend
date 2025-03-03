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
  let getAllUsers
  let mockReq
  let mockRes
  let getAllUsersSpy

  beforeEach(() => {
    getAllUsers = userControllerModule.getAllUsers

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
    getAllUsersSpy = jest.spyOn(UserServiceModule.default.prototype, 'getAllUsers')

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.spyOn(log, 'warn')
  })

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
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

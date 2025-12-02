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
      const role = null;
      const page = 1
      const limit = 10

      const mockUsers = validUsers.map((user, index) => ({
        id: index + 1,
        ...user,
      }))

      // Mock the service response
      getAllUsersSpy.mockResolvedValue({
        count: mockUsers.length,
        rows: mockUsers, // No need for `get()` mocks if password is excluded
      })

      // Mock request query parameters
      mockReq.query = { role: null, page: String(page), limit: String(limit) }

      // Act
      await getAllUsers(mockReq, mockRes)

      // Assert
      expect(getAllUsersSpy).toHaveBeenCalledWith(role, page, limit) // Ensure service is called correctly
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        count: mockUsers.length,
        totalPages: Math.ceil(mockUsers.length / limit),
        currentPage: page,
        users: mockUsers, // Directly returned since passwords are excluded in the service
      })
      expect(log.info).toHaveBeenCalledWith('Retrieved users')
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      })
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to send password reset email',
        },
      })
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      })
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid code',
        },
      })
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to confirm code',
        },
      })
    })
  })

  describe('resetPassword', () => {
    test('should reset password successfully', async () => {
      // Arrange
      mockReq.body = {
        email: validUsers[0].email,
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123',
      }
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      })
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
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reset password',
        },
      })
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
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
        },
      })
    })
  })

  describe('deleteUser', () => {
    test('should delete a user successfully', async () => {
      // Arrange
      const userId = '123'
      mockReq.params = { id: userId }

      jest.spyOn(UserServiceModule.default.prototype, 'deleteUser').mockResolvedValue(true)

      // Act
      await userControllerModule.deleteUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' })
      expect(log.info).toHaveBeenCalledWith(`User with ID ${userId} deleted`)
    })

    test('should return 404 if user to delete is not found', async () => {
      // Arrange
      const userId = '999'
      mockReq.params = { id: userId }

      jest.spyOn(UserServiceModule.default.prototype, 'deleteUser').mockResolvedValue(false)

      // Act
      await userControllerModule.deleteUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' })
    })

    test('should return 500 if an error occurs during deletion', async () => {
      // Arrange
      const userId = '123'
      mockReq.params = { id: userId }

      jest
        .spyOn(UserServiceModule.default.prototype, 'deleteUser')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.deleteUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete user',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('createUser', () => {
    test('should create a user successfully', async () => {
      // Arrange
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'User',
        birth_date: '1990-01-01',
        contact_no: '09876543210',
        school_id: '12345',
        role: 'learner',
        middle_initial: 'X',
      }

      mockReq.body = userData

      const createdUser = {
        id: 999,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
      }

      jest.spyOn(UserServiceModule.default.prototype, 'createUser').mockResolvedValue(createdUser)

      // Act
      await userControllerModule.createUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: createdUser,
      })
      expect(log.info).toHaveBeenCalledWith(`User ${userData.email} created successfully`)
    })

    test('should return 400 for validation errors during user creation', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'weak',
        first_name: 'New',
        last_name: 'User',
      }

      mockReq.body = userData

      const validationError = new Error('Email format is invalid')
      validationError.name = 'ValidationError'
      validationError.path = 'email'

      jest
        .spyOn(UserServiceModule.default.prototype, 'createUser')
        .mockRejectedValue(validationError)

      // Act
      await userControllerModule.createUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email format is invalid',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should return 409 for duplicate email during user creation', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        first_name: 'Existing',
        last_name: 'User',
      }

      mockReq.body = userData

      const duplicateError = new Error('Email already exists')
      duplicateError.name = 'SequelizeUniqueConstraintError'
      duplicateError.errors = [{ path: 'email', message: 'Email already exists' }]

      jest
        .spyOn(UserServiceModule.default.prototype, 'createUser')
        .mockRejectedValue(duplicateError)

      // Act
      await userControllerModule.createUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          details: {
            email: 'email already exists',
          },
          message: 'Email already exists',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should return 500 if an unexpected error occurs during user creation', async () => {
      // Arrange
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        first_name: 'New',
        last_name: 'User',
      }

      mockReq.body = userData

      jest
        .spyOn(UserServiceModule.default.prototype, 'createUser')
        .mockRejectedValue(new Error('Database connection error'))

      // Act
      await userControllerModule.createUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create user',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAvailableLearners', () => {
    test('should return all available learners successfully', async () => {
      // Arrange
      const mockLearners = [
        { id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
      ]

      jest
        .spyOn(UserServiceModule.default.prototype, 'getAvailableLearners')
        .mockResolvedValue(mockLearners)

      // Act
      await userControllerModule.getAvailableLearners(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockLearners)
      expect(log.info).toHaveBeenCalledWith('Retrieved available learners')
    })

    test('should return 500 if an error occurs', async () => {
      // Arrange
      jest
        .spyOn(UserServiceModule.default.prototype, 'getAvailableLearners')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.getAvailableLearners(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve learners',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAvailableStudentTeachers', () => {
    test('should return all available student teachers successfully', async () => {
      // Arrange
      const mockStudentTeachers = [
        { id: 1, first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com' },
        { id: 2, first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' },
      ]

      jest
        .spyOn(UserServiceModule.default.prototype, 'getAvailableStudentTeachers')
        .mockResolvedValue(mockStudentTeachers)

      // Act
      await userControllerModule.getAvailableStudentTeachers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockStudentTeachers)
      expect(log.info).toHaveBeenCalledWith('Retrieved available student teachers')
    })

    test('should return 500 if an error occurs', async () => {
      // Arrange
      jest
        .spyOn(UserServiceModule.default.prototype, 'getAvailableStudentTeachers')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.getAvailableStudentTeachers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve student teachers',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('updateUser', () => {
    test('should update a user successfully', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        first_name: 'Updated',
        last_name: 'User',
        email: 'updated@example.com',
        role: 'teacher',
      }

      mockReq.params = { id: userId }
      mockReq.body = userData

      const updatedUser = {
        id: userId,
        ...userData,
      }

      jest.spyOn(UserServiceModule.default.prototype, 'updateUser').mockResolvedValue(updatedUser)

      // Act
      await userControllerModule.updateUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User updated successfully',
        user: updatedUser,
      })
      expect(log.info).toHaveBeenCalledWith(`User with ID ${userId} updated successfully`)
    })

    test('should return 400 if admin role is provided', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      }

      mockReq.params = { id: userId }
      mockReq.body = userData

      // Act
      await userControllerModule.updateUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot set admin role through this endpoint',
        },
      })
      expect(UserServiceModule.default.prototype.updateUser).not.toHaveBeenCalled()
    })

    test('should return 400 if invalid role is provided', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        first_name: 'Invalid',
        last_name: 'Role',
        role: 'invalid_role',
      }

      mockReq.params = { id: userId }
      mockReq.body = userData

      // Act
      await userControllerModule.updateUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role. Allowed roles are: teacher, student teacher, learner',
        },
      })
      expect(UserServiceModule.default.prototype.updateUser).not.toHaveBeenCalled()
    })

    test('should return 404 if user is not found', async () => {
      // Arrange
      const userId = '999'
      const userData = {
        first_name: 'Not',
        last_name: 'Found',
      }

      mockReq.params = { id: userId }
      mockReq.body = userData

      jest
        .spyOn(UserServiceModule.default.prototype, 'updateUser')
        .mockRejectedValue(new Error('User not found'))

      // Act
      await userControllerModule.updateUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should return 500 if an error occurs during update', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        first_name: 'Error',
        last_name: 'User',
      }

      mockReq.params = { id: userId }
      mockReq.body = userData

      jest
        .spyOn(UserServiceModule.default.prototype, 'updateUser')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.updateUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update user',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })
  describe('changePassword', () => {
    test('should change the password of the user', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        oldPassword: 'OldPassw0rd!',
        newPassword: 'NewPassw0rd!',
        confirmPassword: 'NewPassw0rd!',
      }

      mockReq.params = { userId }
      mockReq.body = userData

      jest.spyOn(UserServiceModule.default.prototype, 'changePassword').mockResolvedValue()

      // Act
      await userControllerModule.changePassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password changed successfully' })
      expect(log.info).toHaveBeenCalledWith(`Password changed for user with ID ${userId}`)
    })

    test('should return 400 if old password is incorrect', async () => {
      // Arrange
      const userId = '123'
      const userData = {
        oldPassword: 'Wrongpassword',
        newPassword: 'NewPassw0rd!',
        confirmPassword: 'NewPassw0rd!',
      }

      mockReq.params = { userId }
      mockReq.body = userData

      jest
        .spyOn(UserServiceModule.default.prototype, 'changePassword')
        .mockRejectedValue(new Error('Invalid password'))

      // Act
      await userControllerModule.changePassword(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid password',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('restoreUser', () => {
    test('should restore a user successfully', async () => {
      // Arrange
      const email = 'hello123@example.com'

      mockReq.params = { email: email }

      jest.spyOn(UserServiceModule.default.prototype, 'restoreUser').mockResolvedValue(true)

      // Act
      await userControllerModule.restoreUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User restored successfully ',
      })
      expect(log.info).toHaveBeenCalledWith(`User with email ${email} restored successfully`)
    })

    test('should return 404 if user to restore is not found', async () => {
      // Arrange
      const userId = '999'
      mockReq.params = { id: userId }

      jest
        .spyOn(UserServiceModule.default.prototype, 'restoreUser')
        .mockRejectedValue(new Error('User not found'))

      // Act
      await userControllerModule.restoreUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should return 500 if an error occurs during restoration', async () => {
      // Arrange
      const userId = '123'
      mockReq.params = { id: userId }

      jest
        .spyOn(UserServiceModule.default.prototype, 'restoreUser')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.restoreUser(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to restore user',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAllDeletedUsers', () => {
    test('should return all deleted users with pagination', async () => {
      // Arrange
      const page = 2
      const limit = 5

      const deletedUsers = {
        count: 12,
        rows: [
          { id: 1, first_name: 'Deleted', last_name: 'User1', email: 'deleted1@example.com' },
          { id: 2, first_name: 'Deleted', last_name: 'User2', email: 'deleted2@example.com' },
          { id: 3, first_name: 'Deleted', last_name: 'User3', email: 'deleted3@example.com' },
          { id: 4, first_name: 'Deleted', last_name: 'User4', email: 'deleted4@example.com' },
          { id: 5, first_name: 'Deleted', last_name: 'User5', email: 'deleted5@example.com' },
        ],
      }

      mockReq.query = { page: String(page), limit: String(limit) }

      jest
        .spyOn(UserServiceModule.default.prototype, 'getAllDeletedUsers')
        .mockResolvedValue(deletedUsers)

      // Act
      await userControllerModule.getAllDeletedUsers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        count: deletedUsers.count,
        totalPages: Math.ceil(deletedUsers.count / limit),
        currentPage: page,
        users: deletedUsers.rows,
      })
      expect(log.info).toHaveBeenCalledWith('Retrieved all deleted users')
    })

    test('should use default pagination if not provided', async () => {
      // Arrange
      const defaultPage = 1
      const defaultLimit = 10

      const deletedUsers = {
        count: 3,
        rows: [
          { id: 1, first_name: 'Deleted', last_name: 'User1', email: 'deleted1@example.com' },
          { id: 2, first_name: 'Deleted', last_name: 'User2', email: 'deleted2@example.com' },
          { id: 3, first_name: 'Deleted', last_name: 'User3', email: 'deleted3@example.com' },
        ],
      }

      mockReq.query = {} // No pagination params

      jest
        .spyOn(UserServiceModule.default.prototype, 'getAllDeletedUsers')
        .mockResolvedValue(deletedUsers)

      // Act
      await userControllerModule.getAllDeletedUsers(mockReq, mockRes)

      // Assert
      expect(UserServiceModule.default.prototype.getAllDeletedUsers).toHaveBeenCalledWith(
        defaultPage,
        defaultLimit
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        count: deletedUsers.count,
        totalPages: Math.ceil(deletedUsers.count / defaultLimit),
        currentPage: defaultPage,
        users: deletedUsers.rows,
      })
    })

    test('should return 500 if an error occurs during retrieval', async () => {
      // Arrange
      mockReq.query = { page: '1', limit: '10' }

      jest
        .spyOn(UserServiceModule.default.prototype, 'getAllDeletedUsers')
        .mockRejectedValue(new Error('Database error'))

      // Act
      await userControllerModule.getAllDeletedUsers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve deleted users',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })
})

import { afterEach, expect, jest } from '@jest/globals'
import { login, getAllUsers, logoutUser } from '../../../src/controllers/userController.js'
import * as UserServiceModule from '../../../src/services/userService.js'
import { log } from '../../../src/utils/logger.js'
import { validUsers } from '../../fixtures/userData.js'

describe('User Controller', () => {
  let mockReq
  let mockRes
  let loginUserSpy
  let getAllUsersSpy
  let logoutUserSpy

  beforeEach(() => {
    mockReq = {
      body: {},
      headers: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    createUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'createUser')
    loginUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'loginUser')
    getAllUsersSpy = jest.spyOn(UserServiceModule.default.prototype, 'getAllUsers')
    logoutUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'logoutUser')

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('login', () => {
    test('should login user successfully', async () => {
      // Arrange
      const loginData = validUsers[0]
      mockReq.body = loginData
      const mockResponse = {
        user: { id: 1, ...loginData },
        token: 'mockedToken',
      }
      loginUserSpy.mockResolvedValue(mockResponse)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Logged in successfully',
        token: mockResponse.token,
        user: mockResponse.user,
      })
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle invalid credentials', async () => {
      // Arrange
      const loginData = { email: 'nonexistent@example.com', password: 'wrongpassword' }
      mockReq.body = loginData
      const error = new Error('Invalid credentials')
      error.name = 'InvalidCredentialsError'
      loginUserSpy.mockRejectedValue(error)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' })
      expect(log.error).toHaveBeenCalledWith('Login error:', error)
    })

    test('should handle general server errors during login', async () => {
      // Arrange
      const loginData = validUsers[0]
      mockReq.body = loginData
      const error = new Error('Server is down')
      loginUserSpy.mockRejectedValue(error)

      // Act
      await login(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication failed' })
      expect(log.error).toHaveBeenCalledWith('Login error:', error)
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
      getAllUsersSpy.mockResolvedValue(mockUsers)

      // Act
      await getAllUsers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers)
      expect(log.info).toHaveBeenCalled()
    })
  })
})

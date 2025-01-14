import { afterEach, expect, jest } from '@jest/globals'
import { signup, login, getAllUsers } from '../../../src/controllers/userController.js'
import * as UserServiceModule from '../../../src/services/userService.js'
import { log } from '../../../src/utils/logger.js'
import { validUsers } from '../../fixtures/userData.js'

describe('User Controller', () => {
  let mockReq
  let mockRes
  let createUserSpy
  let loginUserSpy
  let getAllUsersSpy

  beforeEach(() => {
    mockReq = {
      body: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    createUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'createUser')
    loginUserSpy = jest.spyOn(UserServiceModule.default.prototype, 'loginUser')
    getAllUsersSpy = jest.spyOn(UserServiceModule.default.prototype, 'getAllUsers')

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('signup', () => {
    test('should create user successfully', async () => {
      // Arrange
      const userData = validUsers[0]
      mockReq.body = userData
      const mockUser = { id: 1, ...userData }
      createUserSpy.mockResolvedValue(mockUser)

      // Act
      await signup(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User created successfully',
        user: mockUser,
      })
      expect(log.info).toHaveBeenCalledWith(`User ${userData.username} was successfully created`)
    })

    test('should handle duplicate user error', async () => {
      // Arrange
      mockReq.body = validUsers[0]
      const error = new Error()
      error.name = 'SequelizeUniqueConstraintError'
      createUserSpy.mockRejectedValue(error)

      // Act
      await signup(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username or email already exists',
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle validation errors', async () => {
      // Arrange
      mockReq.body = { username: '', email: 'invalid-email', password: 'short' }
      const error = new Error('Validation failed')
      error.name = 'SequelizeValidationError'
      createUserSpy.mockRejectedValue(error)

      // Act
      await signup(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Validation failed' })
      expect(log.error).toHaveBeenCalledWith('Signup error:', error)
    })

    test('should handle general server errors', async () => {
      // Arrange
      mockReq.body = validUsers[0]
      const error = new Error('Database connection failed')
      createUserSpy.mockRejectedValue(error)

      // Act
      await signup(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error creating user' })
      expect(log.error).toHaveBeenCalledWith('Signup error:', error)
    })
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
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Authentication failed' })
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

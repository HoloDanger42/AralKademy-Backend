import { expect, jest } from '@jest/globals'
import { signup, login, getAllUsers } from '../../../src/controllers/userController.js'
import UserService from '../../../src/services/userService.js'
import { log } from '../../../src/utils/logger.js'
import { validUsers, invalidUsers } from '../../fixtures/userData.js'

// Mock UserService and logger
jest.mock('../../../src/services/userService.js')

describe('User Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.clearAllMocks()
  })

  describe('signup', () => {
    test('should create user successfully', async () => {
      // Arrange
      const userData = validUsers[0]
      mockReq.body = userData
      const mockUser = { id: 1, ...userData }
      UserService.prototype.createUser = jest.fn().mockResolvedValue(mockUser)

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
      UserService.prototype.createUser = jest.fn().mockRejectedValue(error)

      // Act
      await signup(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Username or email already exists',
      })
      expect(log.error).toHaveBeenCalled()
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
      UserService.prototype.loginUser = jest.fn().mockResolvedValue(mockResponse)

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
  })

  describe('getAllUsers', () => {
    test('should return all users successfully', async () => {
      // Arrange
      const mockUsers = validUsers.map((user, index) => ({
        id: index + 1,
        ...user,
      }))
      UserService.prototype.getAllUsers = jest.fn().mockResolvedValue(mockUsers)

      // Act
      await getAllUsers(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers)
      expect(log.info).toHaveBeenCalled()
    })
  })
})

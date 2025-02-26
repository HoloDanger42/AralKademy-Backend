import { afterEach, expect, jest } from '@jest/globals'
import { login, getAllUsers, logoutUser } from '../../../src/controllers/userController.js'
import * as UserServiceModule from '../../../src/services/userService.js'
import { log } from '../../../src/utils/logger.js'
import { validUsers } from '../../fixtures/userData.js'

let fetchMock

jest.unstable_mockModule('node-fetch', async () => {
  console.log('Mocking node-fetch module (async)...')
  fetchMock = jest.fn().mockImplementation((url, options) => {
    console.log('fetch mock called with URL:', url) // Log the URL
    console.log('fetch mock called with options:', options) // Log the options
    console.log('fetch mock returning success: true') // Explicitly log what we are returning
    return Promise.resolve({
      json: () => {
        console.log('fetch mock json() called - returning reCAPTCHA success data')
        return Promise.resolve({
          success: true,
          challenge_ts: 'test',
          hostname: 'localhost',
          score: 0.9,
        }) // Return a more realistic success response
      },
    })
  })
  return { default: fetchMock }
})

describe('User Controller', () => {
  beforeAll(async () => {
    jest.unstable_mockModule('node-fetch', async () => {
      console.log('Mocking node-fetch module (async) - Explicit Return...') // Updated log message
      const fetchMock = jest.fn().mockImplementation((url, options) => {
        console.log('fetch mock called with URL:', url)
        console.log('fetch mock called with options:', options)
        console.log('fetch mock returning success: true')
        return Promise.resolve({
          json: () => {
            console.log('fetch mock json() called - returning reCAPTCHA success data')
            return Promise.resolve({
              success: true,
              challenge_ts: 'test',
              hostname: 'localhost',
              score: 0.9,
            })
          },
        })
      })
      return { default: fetchMock } // Explicitly return fetchMock as default
    })
    await import('node-fetch') // Ensure mock module is loaded before tests
  })

  let mockReq
  let mockRes
  let loginUserSpy
  let getAllUsersSpy
  let logoutUserSpy

  beforeEach(() => {
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

      const mockResponse = {
        user: { id: 1, ...loginData },
        token: 'mockedToken',
      }
      loginUserSpy.mockResolvedValue(mockResponse)

      // Act
      console.log('Before login call')
      await login(mockReq, mockRes)
      console.log('After login call')

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('recaptcha/api/siteverify'),
        expect.any(Object)
      )
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
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
        captchaResponse: 'mock-captcha-response',
      }
      mockReq.body = loginData

      // Mock reCAPTCHA verification success
      fetchMock.mockResolvedValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      })

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

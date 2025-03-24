import { jest } from '@jest/globals'
import { PasswordlessAuthController } from '../../../src/controllers/passwordlessAuthController.js'
import passwordlessAuthService from '../../../src/services/passwordlessAuthService.js'
import { log } from '../../../src/utils/logger.js'

jest.resetModules()

describe('PasswordlessAuthController', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    jest
      .spyOn(passwordlessAuthService, 'generateMagicLink')
      .mockImplementation(() => Promise.resolve('https://example.com/auth/verify?token=abc123'))
    jest.spyOn(passwordlessAuthService, 'generateNumericCode').mockImplementation(() =>
      Promise.resolve({
        code: '123456',
        qrCode: 'data:image/png;base64,...',
      })
    )
    jest.spyOn(passwordlessAuthService, 'generatePictureCode').mockImplementation(() =>
      Promise.resolve({
        pictureCode: 'apple-ball-cat',
        pictures: ['apple', 'ball', 'cat'],
      })
    )
    jest.spyOn(passwordlessAuthService, 'verifyToken').mockImplementation(() =>
      Promise.resolve({
        user: { id: 1, email: 'user@example.com', role: 'teacher' },
        token: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
      })
    )

    jest.spyOn(log, 'info').mockImplementation(() => {})
    jest.spyOn(log, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('requestMagicLink', () => {
    test('should send a magic link when email is provided', async () => {
      // Arrange
      mockReq.body = { email: 'teacher@example.com' }

      // Act
      await PasswordlessAuthController.requestMagicLink(mockReq, mockRes)

      // Assert
      expect(passwordlessAuthService.generateMagicLink).toHaveBeenCalledWith('teacher@example.com')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Login link sent to your email',
      })
      expect(log.info).toHaveBeenCalledWith('Magic link sent to teacher@example.com')
    })

    test('should return 400 when email is not provided', async () => {
      // Act
      await PasswordlessAuthController.requestMagicLink(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { message: 'Email is required' },
      })
      expect(passwordlessAuthService.generateMagicLink).not.toHaveBeenCalled()
    })

    test('should handle errors from service', async () => {
      // Arrange
      mockReq.body = { email: 'teacher@example.com' }
      passwordlessAuthService.generateMagicLink.mockRejectedValueOnce(new Error('User not found'))

      // Act
      await PasswordlessAuthController.requestMagicLink(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'User not found',
          }),
        })
      )
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('requestNumericCode', () => {
    test('should generate a numeric code when identifier is provided', async () => {
      // Arrange
      mockReq.body = { identifier: 'S12345' }
      passwordlessAuthService.generateNumericCode.mockResolvedValue({
        code: '123456',
        qrCode: 'data:image/png;base64,...',
      })

      // Act
      await PasswordlessAuthController.requestNumericCode(mockReq, mockRes)

      // Assert
      expect(passwordlessAuthService.generateNumericCode).toHaveBeenCalledWith('S12345')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login code generated successfully',
          code: '123456',
        })
      )
      expect(log.info).toHaveBeenCalled()
    })

    test('should return 400 when identifier is not provided', async () => {
      // Act
      await PasswordlessAuthController.requestNumericCode(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { message: 'Student ID or username is required' },
      })
    })
  })

  describe('requestPictureCode', () => {
    test('should generate a picture code when identifier is provided', async () => {
      // Arrange
      mockReq.body = { identifier: 'S12345' }
      passwordlessAuthService.generatePictureCode.mockResolvedValue({
        pictureCode: 'apple-ball-cat',
        pictures: ['apple', 'ball', 'cat'],
      })

      // Act
      await PasswordlessAuthController.requestPictureCode(mockReq, mockRes)

      // Assert
      expect(passwordlessAuthService.generatePictureCode).toHaveBeenCalledWith('S12345')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Picture code generated successfully',
          pictureCode: 'apple-ball-cat',
          pictures: ['apple', 'ball', 'cat'],
        })
      )
    })
  })

  describe('verifyToken', () => {
    test('should verify token and return authentication details', async () => {
      // Arrange
      mockReq.body = { token: 'valid-token-123' }
      passwordlessAuthService.verifyToken.mockResolvedValue({
        user: { id: 1, email: 'user@example.com', role: 'teacher' },
        token: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
      })

      // Act
      await PasswordlessAuthController.verifyToken(mockReq, mockRes)

      // Assert
      expect(passwordlessAuthService.verifyToken).toHaveBeenCalledWith('valid-token-123')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'jwt-token-123',
          refreshToken: 'refresh-token-123',
        })
      )
      expect(log.info).toHaveBeenCalled()
    })

    test('should return 400 when token is not provided', async () => {
      // Act
      await PasswordlessAuthController.verifyToken(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: { message: 'Token is required' },
      })
    })

    test('should handle invalid token errors', async () => {
      // Arrange
      mockReq.body = { token: 'invalid-token' }
      passwordlessAuthService.verifyToken.mockRejectedValue(new Error('Invalid or expired token'))

      // Act
      await PasswordlessAuthController.verifyToken(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Invalid or expired token',
          }),
        })
      )
    })
  })
})

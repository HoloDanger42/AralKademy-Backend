import { jest } from '@jest/globals'
import { User } from '../../../src/models/index.js'
import { sequelize } from '../../../src/config/database.js'
import { createTestSchool, createTestUser } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

// Mock functions to be used in unstable_mockModule
const mockSendEmail = jest.fn().mockResolvedValue(true)
const mockToDataURL = jest.fn().mockResolvedValue('mock-qr-code-data-url')
const mockJwtSign = jest.fn().mockReturnValue('mock-jwt-token')

// Mock modules using unstable_mockModule
jest.unstable_mockModule('../../../src/utils/emailUtils.js', () => ({
  sendEmail: mockSendEmail,
}))

jest.unstable_mockModule('qrcode', () => ({
  toDataURL: mockToDataURL,
}))

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: mockJwtSign,
  },
}))

// Import modules after mocking
const { default: passwordlessAuthService } = await import(
  '../../../src/services/passwordlessAuthService.js'
)
const { AuthToken } = await import('../../../src/models/index.js')

describe('PasswordlessAuthService', () => {
  let testUser
  let testSchool

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create a school first (following userService pattern)
    testSchool = await createTestSchool()

    // Create the test user using the helper function
    testUser = await createTestUser({
      email: 'passwordless-test@example.com',
      password: 'not-relevant-for-passwordless',
      first_name: 'Test',
      last_name: 'User',
      role: 'teacher',
      school_id: testSchool.school_id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateMagicLink', () => {
    test('should generate a magic link and store a token', async () => {
      // Act
      const magicLink = await passwordlessAuthService.generateMagicLink(
        'passwordless-test@example.com'
      )

      // Assert
      expect(magicLink).toContain('/auth/verify?token=')

      // In test environment, sendEmail should NOT be called due to the NODE_ENV condition
      expect(mockSendEmail).not.toHaveBeenCalled()

      // Check if token was stored in DB
      const authToken = await AuthToken.findOne({
        where: { userId: testUser.id, type: 'magic_link' },
      })
      expect(authToken).toBeTruthy()
      expect(authToken.used).toBe(false)
      expect(authToken.expiresAt).toBeInstanceOf(Date)
    })

    test('should throw error if user not found', async () => {
      // Act & Assert
      await expect(
        passwordlessAuthService.generateMagicLink('nonexistent@example.com')
      ).rejects.toThrow('User not found')
    })
  })

  describe('generateNumericCode', () => {
    beforeEach(() => {
      // Mock the teacher authority verification to return true for tests
      jest.spyOn(passwordlessAuthService, '_verifyTeacherAuthority').mockResolvedValue(true)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should generate a numeric code for student login', async () => {
      // Act
      const result = await passwordlessAuthService.generateNumericCode(testUser.email, testUser.id)

      // Assert
      expect(result).toHaveProperty('code')
      expect(result).toHaveProperty('qrCode', 'mock-qr-code-data-url')
      expect(result.code).toMatch(/^\d{6}$/)
      expect(mockToDataURL).toHaveBeenCalled()

      // Check if token was stored in DB
      const authToken = await AuthToken.findOne({
        where: { userId: testUser.id, type: 'numeric_code' },
      })
      expect(authToken).toBeTruthy()
      expect(authToken.token).toBe(result.code)
    })

    test('should throw error if student not found', async () => {
      // Act & Assert
      await expect(passwordlessAuthService.generateNumericCode('nonexistent-id')).rejects.toThrow(
        'Student not found'
      )
    })
  })

  describe('generatePictureCode', () => {
    beforeEach(() => {
      // Mock the teacher authority verification to return true for tests
      jest.spyOn(passwordlessAuthService, '_verifyTeacherAuthority').mockResolvedValue(true)
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should generate a picture code for young students', async () => {
      // Act
      const result = await passwordlessAuthService.generatePictureCode(testUser.email, testUser.id)

      // Assert
      expect(result).toHaveProperty('pictureCode')
      expect(result).toHaveProperty('pictures')
      expect(result.pictures).toBeInstanceOf(Array)
      expect(result.pictures.length).toBe(3)

      // Check if token was stored in DB
      const authToken = await AuthToken.findOne({
        where: { userId: testUser.id, type: 'picture_code' },
      })
      expect(authToken).toBeTruthy()
      expect(authToken.token).toBe(result.pictureCode)
    })
  })

  describe('verifyToken', () => {
    test('should verify token and return JWT tokens', async () => {
      // Arrange
      const token = 'test-token-123'
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      await AuthToken.create({
        token,
        userId: testUser.id,
        type: 'magic_link',
        expiresAt: expiresAt,
        used: false,
      })

      // Act
      const result = await passwordlessAuthService.verifyToken(token)

      // Assert
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('refreshToken')
      expect(mockJwtSign).toHaveBeenCalledTimes(2)

      // Check if token was marked as used
      const authToken = await AuthToken.findOne({ where: { token } })
      expect(authToken.used).toBe(true)

      // Check if user's refresh token was updated
      const updatedUser = await User.findByPk(testUser.id)
      expect(updatedUser.refreshToken).toBe('mock-jwt-token')
    })

    test('should throw error if token is invalid', async () => {
      // Act & Assert
      await expect(passwordlessAuthService.verifyToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token'
      )
    })

    test('should throw error if token is expired', async () => {
      // Arrange
      const expiredToken = 'expired-token-123'
      const expiredDate = new Date(Date.now() - 1000) // 1 second in the past

      await AuthToken.create({
        token: expiredToken,
        userId: testUser.id,
        type: 'magic_link',
        expiresAt: expiredDate,
        used: false,
      })

      // Act & Assert
      await expect(passwordlessAuthService.verifyToken(expiredToken)).rejects.toThrow(
        'Invalid or expired token'
      )
    })

    test('should throw error if token is already used', async () => {
      // Arrange
      const usedToken = 'used-token-123'
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      await AuthToken.create({
        token: usedToken,
        userId: testUser.id,
        type: 'magic_link',
        expiresAt: expiresAt,
        used: true,
      })

      // Act & Assert
      await expect(passwordlessAuthService.verifyToken(usedToken)).rejects.toThrow(
        'Invalid or expired token'
      )
    })
  })
})

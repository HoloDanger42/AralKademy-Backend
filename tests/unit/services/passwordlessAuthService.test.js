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
const { AuthToken, Course, Group, Learner, StudentTeacher } = await import(
  '../../../src/models/index.js'
)

describe('PasswordlessAuthService', () => {
  let testUser
  let testSchool
  let testStudent
  let testStudentTeacher

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

    // Create a student user for testing authority checks
    testStudent = await createTestUser({
      email: 'test-student@example.com',
      password: 'student-password',
      first_name: 'Student',
      last_name: 'Test',
      role: 'learner',
      school_id: testSchool.school_id,
    })

    // Create a student teacher for authority testing
    testStudentTeacher = await createTestUser({
      email: 'student-teacher@example.com',
      password: 'student-teacher-password',
      first_name: 'Student',
      last_name: 'Teacher',
      role: 'student_teacher',
      school_id: testSchool.school_id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  afterEach(() => {
    jest.clearAllMocks()

    // Reset the cache maps between tests
    passwordlessAuthService.failedAttemptsCache.clear()
    passwordlessAuthService.pictureCodeAttemptsCache.clear()
    passwordlessAuthService.ipAttemptsCache.clear()
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

    test('should call sendEmail in non-test environment', async () => {
      // Save the original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV

      try {
        // Temporarily change NODE_ENV to 'development'
        process.env.NODE_ENV = 'development'

        // Create a spy on the private method
        const sendEmailSpy = jest.spyOn(passwordlessAuthService, '_sendMagicLinkEmail')
        sendEmailSpy.mockResolvedValue(true)

        // Act
        await passwordlessAuthService.generateMagicLink('passwordless-test@example.com')

        // Assert
        expect(sendEmailSpy).toHaveBeenCalled()
      } finally {
        // Restore the original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
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

    test('should throw error if teacher has no authority over student', async () => {
      // Restore and mock with false return value
      jest.restoreAllMocks()
      jest.spyOn(passwordlessAuthService, '_verifyTeacherAuthority').mockResolvedValue(false)

      // Act & Assert
      await expect(
        passwordlessAuthService.generateNumericCode(testUser.email, 'unauthorized-teacher-id')
      ).rejects.toThrow('Unauthorized to generate code for this student')
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

    test('should throw error if email is not provided', async () => {
      // Act & Assert
      await expect(passwordlessAuthService.generatePictureCode(null, testUser.id)).rejects.toThrow(
        'Student email required'
      )
    })

    test('should throw error if student not found', async () => {
      // Act & Assert
      await expect(
        passwordlessAuthService.generatePictureCode('nonexistent@example.com', testUser.id)
      ).rejects.toThrow('Student not found')
    })

    test('should throw error if teacher has no authority', async () => {
      // Restore and mock with false return value
      jest.restoreAllMocks()
      jest.spyOn(passwordlessAuthService, '_verifyTeacherAuthority').mockResolvedValue(false)

      // Act & Assert
      await expect(
        passwordlessAuthService.generatePictureCode(testUser.email, 'unauthorized-id')
      ).rejects.toThrow('Unauthorized to generate login code for this student')
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

    test('should handle rate limiting with IP address', async () => {
      const token = 'rate-limit-token'
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      const clientIp = '192.168.1.1'

      await AuthToken.create({
        token,
        userId: testUser.id,
        type: 'magic_link',
        expiresAt: expiresAt,
        used: false,
      })

      // Simulate hitting IP rate limit
      for (let i = 0; i < 10; i++) {
        passwordlessAuthService.ipAttemptsCache.set(clientIp, i + 1)
      }

      // Act & Assert
      await expect(passwordlessAuthService.verifyToken('invalid-token', clientIp)).rejects.toThrow(
        'Too many login attempts from this device'
      )
    })

    test('should handle token-specific rate limiting for picture codes', async () => {
      // Arrange - picture code with rate limiting
      const pictureToken = 'picture-token-123'
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      await AuthToken.create({
        token: pictureToken,
        userId: testUser.id,
        type: 'picture_code',
        expiresAt: expiresAt,
        used: false,
      })

      // Simulate hitting the attempt limit for this specific token
      passwordlessAuthService.pictureCodeAttemptsCache.set(pictureToken, 5)

      // Act & Assert
      await expect(
        passwordlessAuthService.verifyToken(pictureToken, null, 'picture_code')
      ).rejects.toThrow('Too many failed attempts with this code')
    })

    test('should track failed attempts for IP addresses', async () => {
      // Arrange
      const clientIp = '192.168.2.2'

      // Act - try to verify a non-existent token
      try {
        await passwordlessAuthService.verifyToken('non-existent-token', clientIp)
      } catch (error) {
        // expected to throw
      }

      // Assert - IP attempt should be tracked
      expect(passwordlessAuthService.ipAttemptsCache.get(clientIp)).toBe(1)
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
        'This code has already been used. Please request a new code.'
      )
    })
  })

  describe('_sendMagicLinkEmail', () => {
    test('should call sendEmail with correct parameters', async () => {
      // Act
      await passwordlessAuthService._sendMagicLinkEmail(
        { email: 'test@example.com', first_name: 'Test' },
        'https://example.com/magic-link'
      )

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Your AralKademy Login Link',
          text: expect.stringContaining('Hello Test'),
          html: expect.stringContaining('Hello Test!'),
        })
      )
    })
  })

  describe('_verifyTeacherAuthority', () => {
    test('should return true in test environment', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV
      try {
        // Ensure we're in test environment
        process.env.NODE_ENV = 'test'

        // Act
        const result = await passwordlessAuthService._verifyTeacherAuthority(
          'any-teacher',
          'any-student'
        )

        // Assert
        expect(result).toBe(true)
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
    })

    test('should return false if user is not found', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV
      try {
        // Set to non-test environment to bypass automatic true
        process.env.NODE_ENV = 'development'

        // Mock User.findByPk to return null (user not found)
        const findByPkSpy = jest.spyOn(User, 'findByPk').mockResolvedValueOnce(null)

        // Act
        const result = await passwordlessAuthService._verifyTeacherAuthority(
          'non-existent-id',
          testStudent.id
        )

        // Assert
        expect(findByPkSpy).toHaveBeenCalledWith('non-existent-id')
        expect(result).toBe(false)
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
        jest.restoreAllMocks()
      }
    })

    test('should return false if user is not a teacher or student_teacher', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV
      try {
        // Set to non-test environment to bypass automatic true
        process.env.NODE_ENV = 'development'

        // Act
        const result = await passwordlessAuthService._verifyTeacherAuthority(
          testStudent.id,
          testUser.id
        )

        // Assert
        expect(result).toBe(false)
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
    })

    test('should handle error case gracefully', async () => {
      // Save original NODE_ENV
      const originalNodeEnv = process.env.NODE_ENV
      try {
        // Set to non-test environment to bypass automatic true
        process.env.NODE_ENV = 'development'

        // Mock Course.findAll to throw an error
        jest.spyOn(Course, 'findAll').mockRejectedValueOnce(new Error('Database error'))

        // Act
        const result = await passwordlessAuthService._verifyTeacherAuthority(
          testUser.id,
          testStudent.id
        )

        // Assert
        expect(result).toBe(false)
      } finally {
        // Restore original NODE_ENV
        process.env.NODE_ENV = originalNodeEnv
      }
    })
  })
})

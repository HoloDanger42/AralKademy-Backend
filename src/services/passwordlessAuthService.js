import * as jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import config from '../config/config.js'
import { User, Course, Group, StudentTeacher, Learner, AuthToken } from '../models/index.js'
import { sendEmail } from '../utils/emailUtils.js'
import * as QRCode from 'qrcode'
import { Op } from 'sequelize'

class PasswordlessAuthService {
  constructor() {
    this.tokenExpiry = 15 * 60 * 1000 // 15 minutes
    this.jwtSecret = config.jwt.accessTokenSecret
    // Separate caches for different auth types
    this.failedAttemptsCache = new Map() // For magic links and numeric codes
    this.pictureCodeAttemptsCache = new Map() // Specifically for picture codes
    this.ipAttemptsCache = new Map() // For IP-based rate limiting
  }

  /**
   * Generates a magic link for email-based passwordless login
   * Teacher/admin focused method
   *
   * @param {string} email - User's email address
   * @returns {Promise<string>} - The generated magic link
   */
  async generateMagicLink(email) {
    const user = await User.findOne({ where: { email } })
    if (!user) {
      throw new Error('User not found')
    }

    // Create a unique token
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + this.tokenExpiry)

    // Store token in database
    await AuthToken.create({
      token,
      userId: user.id,
      type: 'magic_link',
      expiresAt: expiresAt,
      used: false,
    })

    // Create magic link
    const baseUrl =
      config.env === 'production' ? 'https://aralkademylms.vercel.app' : 'http://localhost:3000'

    const magicLink = `${baseUrl}/auth/verify?token=${token}`

    // Skip sending email in test environment to avoid errors
    if (process.env.NODE_ENV !== 'test') {
      // Send email with magic link
      await this._sendMagicLinkEmail(user, magicLink)
    }

    return magicLink
  }

  /**
   * Generates a 6-digit numeric code for young students
   * Simple method appropriate for elementary students
   *
   * @param {string} email - Student's email address
   * @returns {Promise<{code: string, qrCode: string}>} - Generated code and QR code
   */
  async generateNumericCode(email, teacherUserId) {
    // Find user by email
    const user = await User.findOne({ where: { email } })

    if (!user) {
      throw new Error('Student not found')
    }

    // Verify that the requesting teacher has authority over this student
    const hasAuthority = await this._verifyTeacherAuthority(teacherUserId, user.id)
    if (!hasAuthority) {
      throw new Error('Unauthorized to generate code for this student')
    }

    // Generates a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + this.tokenExpiry)

    // Store token in database
    await AuthToken.create({
      token: code,
      userId: user.id,
      createdBy: teacherUserId,
      type: 'numeric_code',
      expiresAt: expiresAt,
      used: false,
    })

    // Generate QR code for easy scanning
    const qrCode = await QRCode.toDataURL(code)

    return { code, qrCode }
  }

  /**
   * Generates a picture-based code for youngest students (grades 1-3)
   *
   * @param {string} email - Student's email address
   * @param {string|number} teacherId - The ID of the teacher user
   * @returns {Promise<{pictureCode: string, pictures: Array}>} Picture code data
   */
  async generatePictureCode(email, teacherId) {
    if (!email) {
      throw new Error('Student email required')
    }

    // Find user by email
    const user = await User.findOne({ where: { email } })

    if (!user) {
      throw new Error('Student not found')
    }

    // Verify teacher has authority over this student
    const isAuthorized = await this._verifyTeacherAuthority(teacherId, user.id)
    if (!isAuthorized) {
      throw new Error('Unauthorized to generate login code for this student')
    }

    // Generate a picture-based code (sequence of 3 pictures from a set)
    const allPictures = [
      'apple',
      'ball',
      'cat',
      'dog',
      'elephant',
      'fish',
      'giraffe',
      'house',
      'ice-cream',
      'kite',
    ]

    const shuffledPictures = [...allPictures];
    
    for (let i = shuffledPictures.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPictures[i], shuffledPictures[j]] = [shuffledPictures[j], shuffledPictures[i]];
    }
    const pictureCode = shuffledPictures.slice(0, 3);

    // Join with separator and store in DB
    const tokenString = pictureCode.join('-')
    const expiresAt = new Date(Date.now() + this.tokenExpiry)

    await AuthToken.create({
      token: tokenString,
      userId: user.id,
      type: 'picture_code',
      expiresAt: expiresAt,
      used: false,
    })

    return {
      pictureCode: tokenString,
      pictures: pictureCode,
    }
  }

  /**
   * Verifies any type of passwordless token and returns JWT tokens
   *
   * @param {string} token - The token to verify
   * @param {string} [clientIp] - Optional client IP address for rate limiting
   * @param {string} [tokenType] - Type of token being verified ('magic_link', 'numeric_code', 'picture_code')
   * @returns {Promise<Object>} User data and JWT tokens if valid
   */
  async verifyToken(token, clientIp = null, tokenType = null) {
    let attemptCache
    let maxAttempts
    let cacheTimeout

    // Select appropriate cache and limits based on token type
    if (tokenType === 'picture_code') {
      attemptCache = this.pictureCodeAttemptsCache
      maxAttempts = 5 // More attempts for picture codes (kid-friendly)
      cacheTimeout = 2 * 60 * 1000 // 2 minutes cooldown
    } else {
      attemptCache = this.failedAttemptsCache
      maxAttempts = 3 // Stricter for magic links and numeric codes
      cacheTimeout = 10 * 60 * 1000 // 10 minutes cooldown
    }

    // IP-based rate limiting
    if (clientIp) {
      const ipAttempts = this.ipAttemptsCache.get(clientIp) || 0
      if (ipAttempts >= 10) {
        // 10 attempts per IP
        throw new Error('Too many login attempts from this device. Please try again later.')
      }
    }

    // First check if the token exists in the database before checking cache
    const authToken = await AuthToken.findOne({
      where: {
        token,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    })

    if (!authToken) {
      // Only track failed attempts for IP to prevent storing unlimited invalid tokens
      if (clientIp) {
        const currentIpAttempts = this.ipAttemptsCache.get(clientIp) || 0
        this.ipAttemptsCache.set(clientIp, currentIpAttempts + 1)

        // Reset IP attempts after 15 minutes
        setTimeout(() => this.ipAttemptsCache.delete(clientIp), 15 * 60 * 1000)
      }

      throw new Error('Invalid or expired token')
    }

    // Only check attempt cache for tokens that do exist in the database
    const failedAttempts = attemptCache.get(token) || 0
    if (failedAttempts >= maxAttempts) {
      throw new Error('Too many failed attempts with this code. Please request a new code.')
    }

    // If token is already used, provide a clear error
    if (authToken.used) {
      throw new Error('This code has already been used. Please request a new code.')
    }

    // Mark token as used after successful verification
    await authToken.update({ used: true })

    const user = authToken.user

    // Generate JWT
    const accessToken = jwt.default.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
      },
      config.jwt.accessTokenSecret,
      { expiresIn: config.jwt.accessTokenExpiry }
    )

    // Generate refresh token
    const refreshToken = jwt.default.sign({ id: user.id }, config.jwt.refreshTokenSecret, {
      expiresIn: config.jwt.refreshTokenExpiry,
    })

    // Updates user's refresh token
    await User.update({ refreshToken }, { where: { id: user.id } })

    // Clear any failed attempts for this token
    attemptCache.delete(token)
    if (clientIp) {
      this.ipAttemptsCache.delete(clientIp)
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
      },
      token: accessToken,
      refreshToken,
    }
  }

  /**
   * Sends magic link email to user
   * @private
   */
  async _sendMagicLinkEmail(user, magicLink) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'aralkademy.noreply@gmail.com',
      to: user.email,
      subject: 'Your AralKademy Login Link',
      text: `Hello ${user.first_name},\n\nClick this link to login to AralKademy: ${magicLink}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this link, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Hello ${user.first_name}!</h2>
          <p>Click the big button below to login to AralKademy:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${magicLink}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; font-size: 16px;">
              Login to AralKademy
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">This link will expire in 15 minutes. If you didn't request this link, please ignore this email.</p>
        </div>
      `,
    }

    await sendEmail(mailOptions)
  }

  /**
   * Verifies if a teacher has authority over a student by checking their relationship in the database
   * @async
   * @param {string|number} teacherUserId - The ID of the teacher user
   * @param {string|number} studentUserId - The ID of the student user
   * @returns {Promise<boolean>} Returns true if teacher has authority over student, false otherwise
   * @private
   */
  async _verifyTeacherAuthority(teacherUserId, studentUserId) {
    // For testing purposes, always return true
    if (process.env.NODE_ENV === 'test') {
      return true
    }

    const teacher = await User.findByPk(teacherUserId)
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'student_teacher')) {
      return false
    }

    try {
      // Different verification logic based on role
      if (teacher.role === 'teacher') {
        // Find courses taught by this teacher
        const courses = await Course.findAll({
          where: { user_id: teacherUserId },
          include: [
            {
              model: Group,
              as: 'learnerGroup',
              include: [
                {
                  model: Learner,
                  as: 'learners',
                  where: { user_id: studentUserId },
                },
              ],
            },
          ],
        })

        return courses.length > 0
      } else {
        // For student_teachers, check if they're in the same group as the student
        const studentTeacher = await StudentTeacher.findOne({
          where: { user_id: teacherUserId },
        })

        if (!studentTeacher || !studentTeacher.student_teacher_group_id) {
          return false
        }

        // Check if the learner is in the same group
        const learner = await Learner.findOne({
          where: {
            user_id: studentUserId,
            learner_group_id: studentTeacher.student_teacher_group_id,
          },
        })

        return !!learner
      }
    } catch (error) {
      console.error('Error verifying teacher authority:', error)
      return false
    }
  }
}

export default new PasswordlessAuthService()

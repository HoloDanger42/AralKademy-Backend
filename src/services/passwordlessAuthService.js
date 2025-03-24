import * as jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import config from '../config/config.js'
import { User, AuthToken } from '../models/index.js'
import { sendEmail } from '../utils/emailUtils.js'
import * as QRCode from 'qrcode'
import { Op } from 'sequelize'

class PasswordlessAuthService {
  constructor() {
    this.tokenExpiry = 15 * 60 * 1000 // 15 minutes
    this.jwtSecret = config.jwt.accessTokenSecret
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

    // Send email with magic link
    await this._sendMagicLinkEmail(user, magicLink)

    return magicLink
  }

  /**
   * Generates a 6-digit numeric code for young students
   * Simple method appropriate for elementary students
   *
   * @param {string} identifier - Student ID or username
   * @returns {Promise<{code: string, qrCode: string}>} - Generated code and QR code
   */
  async generateNumericCode(identifier) {
    // Build a dynamic where clause based on the type of identifier
    let whereClause = {}

    if (!isNaN(identifier) && identifier.trim() !== '') {
      // It's a number, search by school_id
      whereClause[Op.or] = [{ school_id: parseInt(identifier, 10) }]
    } else {
      // It's a string, search by email instead of username
      whereClause[Op.or] = [{ email: identifier }]
    }

    // Find user with the appropriate where clause
    const user = await User.findOne({ where: whereClause })

    if (!user) {
      throw new Error('Student not found')
    }

    // Generates a simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + this.tokenExpiry)

    // Store token in database
    await AuthToken.create({
      token: code,
      userId: user.id,
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
   * @param {string} identifier - Student ID or username
   * @returns {Promise<{pictureCode: string, pictures: Array}>} Picture code data
   */
  async generatePictureCode(identifier) {
    // Build a dynamic where clause based on the type of identifier
    let whereClause = {}

    if (!identifier) {
      throw new Error('Student identifier required')
    }

    if (
      typeof identifier === 'number' ||
      (typeof identifier === 'string' && !isNaN(identifier) && identifier.trim() !== '')
    ) {
      // It's a number or a numeric string, search by school_id
      const numericIdentifier =
        typeof identifier === 'number' ? identifier : parseInt(identifier, 10)
      whereClause[Op.or] = [{ school_id: numericIdentifier }]
    } else if (typeof identifier === 'string') {
      // It's a non-numeric string, search by email
      whereClause[Op.or] = [{ email: identifier }]
    } else {
      throw new Error('Invalid identifier type')
    }

    // Find user with the appropriate where clause
    const user = await User.findOne({ where: whereClause })

    if (!user) {
      throw new Error('Student not found')
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

    // Select 3 random pictures
    const pictureCode = []
    for (let i = 0; i < 3; i++) {
      const randomIdx = Math.floor(Math.random() * allPictures.length)
      pictureCode.push(allPictures[randomIdx])
    }

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
   * @returns {Promise<Object>} User data and JWT tokens if valid
   */
  async verifyToken(token) {
    const authToken = await AuthToken.findOne({
      where: {
        token,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: User, as: 'user' }],
    })

    if (!authToken) {
      throw new Error('Invalid or expired token')
    }

    // Mark token as used
    authToken.used = true
    await authToken.save()

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
      from: process.env.EMAIL_USER,
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
}

export default new PasswordlessAuthService()

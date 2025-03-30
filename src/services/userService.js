import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import config from '../config/config.js'
import { log } from '../utils/logger.js'
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';

// Configure nodemailer with proper error handling
const transporter = (() => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log.warn('Email credentials not configured.')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
})()

class UserService {
  /**
   * @class UserService
   * @description Handles user-related operations and authentication
   * @param {Object} UserModel - Model for user data
   * @param {Object} TeacherModel - Model for teacher data
   * @param {Object} AdminModel - Model for admin data
   * @param {Object} StudentTeacherModel - Model for student-teacher relationships
   * @param {Object} LearnerModel - Model for learner data
   * @param {Object} EnrollmentModel - Model for enrollment data
   * @param {Object} CourseModel - Model for course data
   * @param {Object} GroupModel - Model for group data
   * @param {Object} SchoolModel - Model for school data
   * @param {Object} BlacklistModel - Model for blacklisted tokens
   */
  constructor(
    UserModel,
    TeacherModel,
    AdminModel,
    StudentTeacherModel,
    LearnerModel,
    EnrollmentModel,
    CourseModel,
    GroupModel,
    SchoolModel,
    BlacklistModel
  ) {
    this.UserModel = UserModel
    this.TeacherModel = TeacherModel
    this.AdminModel = AdminModel
    this.StudentTeacherModel = StudentTeacherModel
    this.LearnerModel = LearnerModel
    this.EnrollmentModel = EnrollmentModel
    this.Course = CourseModel
    this.Group = GroupModel
    this.School = SchoolModel
    this.jwtSecret = process.env.JWT_SECRET
    this.BlacklistModel = BlacklistModel
  }

  /**
   * Validates user data fields.
   *
   * @param {Object} userData - The user data object to validate
   * @param {string} [userData.email] - The user's email address (must be a valid email format)
   * @param {string} [userData.contact_no] - The user's contact number (must be a Philippine mobile number starting with 09 followed by 9 digits)
   * @throws {Error} Throws error when email format is invalid
   * @throws {Error} Throws error when contact number format is invalid
   */
  validateUserData(userData) {
    if (userData.email && !userData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email format')
    }
    if (userData.contact_no && !userData.contact_no.match(/^09\d{9}$/)) {
      throw new Error('Invalid contact number format')
    }
  }

  /**
   * Validates if the provided role is among the allowed roles in the system.
   * @param {string} role - The role to validate (e.g., 'admin', 'teacher', 'student_teacher', 'learner').
   * @throws {Error} Throws an error if the role is not valid.
   */
  validateRole(role) {
    const validRoles = ['admin', 'teacher', 'student_teacher', 'learner']
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role.')
    }
  }

  /**
   * Validates a password to ensure it meets the required criteria.
   * @param {string} password - The password to validate
   * @throws {Error} If the password is empty or less than 8 characters
   * @returns {void}
   */
  validatePassword(password) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
  }

  /**
   * Creates a new user with the specified details and associated role in the system.
   *
   * @async
   * @param {string} email - User's email address (must be unique)
   * @param {string} password - User's password (will be hashed)
   * @param {string} firstName - User's first name
   * @param {string} lastName - User's last name
   * @param {Date|string} birthDate - User's birth date
   * @param {string} contactNo - User's contact number
   * @param {string} schoolId - User's school ID
   * @param {string} role - User's role ('teacher', 'admin', 'student_teacher', or 'learner')
   * @param {string|null} [middleInitial=null] - User's middle initial
   * @param {string|null} [department=null] - Department (required for student_teacher role)
   * @param {string|null} [section=null] - Section (required for student_teacher role)
   * @param {number|null} [groupId=null] - Group ID (optional for learner, required for student_teacher)
   * @returns {Promise<Object>} The created user object
   * @throws {Error} If email already exists or if validation fails
   */
  async createUser(
    email,
    password,
    firstName,
    lastName,
    birthDate,
    contactNo,
    schoolId,
    role,
    middleInitial = null,
    department = null,
    section = null,
    groupId = null,
    skipEmail = false
  ) {
    const transaction = await this.UserModel.sequelize.transaction()
    try {
      const hashedPassword = await bcrypt.hash(password, 10)

      const userData = {
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        birth_date: birthDate,
        contact_no: contactNo,
        school_id: schoolId,
        middle_initial: middleInitial,
      }

      this.validateUserData(userData)
      this.validateRole(role)
      this.validatePassword(password)

      const user = await this.UserModel.create(userData, { transaction })

      if (role === 'teacher') {
        await this.TeacherModel.create({ user_id: user.id }, { transaction })
      } else if (role === 'admin') {
        await this.AdminModel.create({ user_id: user.id }, { transaction })
      } else if (role === 'student_teacher') {
        await this.StudentTeacherModel.create(
          { user_id: user.id, department: department, section: section, group_id: groupId },
          { transaction }
        )
      } else if (role === 'learner') {
        if (groupId) {
          await this.LearnerModel.create({ user_id: user.id, group_id: groupId }, { transaction })
        } else {
          await this.LearnerModel.create({ user_id: user.id }, { transaction }) // Create without group
        }
      }

      await transaction.commit()

      if (!skipEmail) {
        try {
          if (!transporter) {
            log.error('Email service not configured.')
            throw new Error('Email service unavailable')
          }

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your Account Has Been Created',
            text: `
              Hello ${firstName},
  
              Your account has been successfully created.
  
              Email: ${email}
              Password: ${password}
  
              For security reasons, we recommend changing your password.
  
              Best regards,  
              AralKademy Team`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <h2 style="color: #4a4a4a;">Welcome to AralKademy!</h2>
                <p>Your account has been successfully created. Below are your login details:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Password:</strong> ${password}</p>
                </div>
                <p>For security reasons, we recommend changing your password.</p>
                <p>If you have any questions, feel free to contact us at aralkademy.techsupp@gmail.com.</p>
                <p>Best regards,</p>
                <p><strong>AralKademy Team</strong></p>
              </div>
            `,
          }

          await transporter.sendMail(mailOptions)
        } catch (emailError) {
          log.error('Failed to send email:', emailError)
        }
      }

      return user
    } catch (error) {
      if (transaction && transaction.finished !== 'commit') {
        await transaction.rollback()
      }

      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors[0].path === 'email') {
          throw new Error('Email already exists')
        }
      }

      throw error
    }
  }

  /**
   * Authenticates a user based on email and password
   * @async
   * @param {string} email - The email of the user trying to login
   * @param {string} password - The password of the user trying to login
   * @returns {Promise<Object>} An object containing the user and authentication token
   * @throws {Error} When credentials are invalid or any other error occurs during authentication
   */
  async loginUser(email, password) {
    try {
      const user = await this.UserModel.findOne({ where: { email } })

      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials')
      }

      // Generate access token (short-lived)
      const token = this.generateToken(user, '15m') // 15 minutes

      // Generate refresh token (longer-lived)
      const refreshToken = this.generateToken(user, '7d', true) // 7 days, refresh=true

      await this.UserModel.update({ refreshToken: refreshToken }, { where: { id: user.id } })

      return { user, token, refreshToken }
    } catch (error) {
      log.error('Error in loginUser:', error)
      throw error
    }
  }

  /**
   * Generates a JSON Web Token (JWT) for user authentication
   * @param {Object} user - The user object containing id, email, and role
   * @param {string} [expiresIn='1h'] - Token expiration time (default: 1 hour)
   * @param {boolean} [isRefreshToken=false] - Whether to generate a refresh token
   * @returns {string} The generated JWT token
   */
  generateToken(user, expiresIn = '1h', isRefreshToken = false) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: isRefreshToken ? 'refresh' : 'access',
    }
    return jwt.sign(
      payload,
      isRefreshToken ? config.jwt.refreshTokenSecret : config.jwt.accessTokenSecret,
      { expiresIn }
    )
  }

  /**
   * Retrieves a paginated list of all users from the database, excluding their passwords
   * @async
   * @param {number} [page=1] - The page number to retrieve (defaults to 1)
   * @param {number} [limit=10] - The number of users per page (defaults to 10)
   * @returns {Promise<Object>} A promise that resolves to an object containing the users and count
   * @returns {Array} returns.rows - Array of user objects
   * @returns {number} returns.count - Total number of users
   */
  async getAllUsers(page = 1, limit = 10) {
    const { count, rows } = await this.UserModel.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['password'] },
    });
  
    const roleCounts = await this.UserModel.findAll({
      attributes: ['role', [Sequelize.fn('COUNT', Sequelize.col('role')), 'count']],
      group: ['role'],
      raw: true
    });
  
    return { count, rows, roleCounts };
  }

  /**
   * Retrieves all learners who are not currently assigned to any group.
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of learner objects (excluding passwords).
   */
  async getAvailableLearners() {
    return await this.UserModel.findAll({
      where: { role: 'learner' },
      include: [
        {
          model: this.LearnerModel,
          as: 'learner',
          where: { group_id: null },
          required: true,
        },
      ],
      attributes: { exclude: ['password'] },
    })
  }

  /**
   * Retrieves all student teachers who are not currently assigned to any group.
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of student teacher objects (excluding passwords).
   */
  async getAvailableStudentTeachers() {
    return await this.UserModel.findAll({
      where: { role: 'student_teacher' },
      include: [
        {
          model: this.StudentTeacherModel,
          as: 'studentTeacher',
          where: { group_id: null },
          required: true,
        },
      ],
      attributes: { exclude: ['password'] },
    })
  }

  /**
   * Retrieves a user by their ID along with associated relationships.
   * @param {number|string} userId - The ID of the user to retrieve.
   * @throws {Error} If userId is not provided.
   * @throws {Error} If userId is not a valid number format.
   * @throws {Error} If user is not found.
   * @returns {Promise<Object>} The user object with associated teacher, admin, studentTeacher, learner and school data.
   * The returned user object excludes the password field and includes:
   * - teacher: Associated teacher data with their courses
   * - admin: Associated admin data with their enrollments
   * - studentTeacher: Associated student teacher data with their group
   * - learner: Associated learner data with their group
   * - school: Associated school data
   */
  async getUserById(userId) {
    if (!userId) {
      throw new Error('User ID is required')
    }

    // Convert to number if it's a string
    const id = Number(userId)
    if (isNaN(id)) {
      throw new Error('Invalid user ID format')
    }

    const user = await this.UserModel.findOne({
      where: { id },
      include: [
        {
          model: this.TeacherModel,
          as: 'teacher',
          required: false,
          include: [
            {
              model: this.Course,
              as: 'courses',
            },
          ],
        },
        {
          model: this.AdminModel,
          as: 'admin',
          required: false,
          include: [
            {
              model: this.EnrollmentModel,
              as: 'enrollments',
            },
          ],
        },
        {
          model: this.StudentTeacherModel,
          as: 'studentTeacher',
          required: false,
          include: [
            {
              model: this.Group,
              as: 'group',
            },
          ],
        },
        {
          model: this.LearnerModel,
          as: 'learner',
          required: false,
          include: [
            {
              model: this.Group,
              as: 'group',
            },
          ],
        },
        {
          model: this.School,
          as: 'school',
        },
      ],
      attributes: { exclude: ['password'] },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  /**
   * Updates a user's information in the database
   * @async
   * @param {number|string} userId - The ID of the user to update
   * @param {Object} userData - The user data to update
   * @param {string} [userData.firstName] - The user's first name
   * @param {string} [userData.lastName] - The user's last name
   * @param {string} [userData.email] - The user's email address
   * @returns {Promise<Object>} The updated user object
   * @throws {Error} If user is not found
   * @throws {Error} If validation fails
   */
  async updateUser(userId, userData) {
    this.validateUserData(userData)
    const transaction = await this.UserModel.sequelize.transaction()
    try {
      const user = await this.UserModel.findByPk(userId)
      if (!user) throw new Error('User not found')

      await user.update(userData, { transaction })
      await transaction.commit()
      return user
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Deletes a user and their associated role-specific data (teacher or admin) from the database.
   * Uses a transaction to ensure data consistency across multiple tables.
   *
   * @async
   * @param {number|string} userId - The unique identifier of the user to delete
   * @throws {Error} When user is not found
   * @returns {Promise<boolean>} Returns true if deletion is successful
   */
  async deleteUser(userId) {
    const transaction = await this.UserModel.sequelize.transaction()
    try {
      const user = await this.UserModel.findByPk(userId)
      if (!user) throw new Error('User not found')

      if (user.role === 'teacher') {
        await this.TeacherModel.destroy({
          where: { user_id: userId },
          force: true,
          transaction,
        })
      } else if (user.role === 'admin') {
        await this.AdminModel.destroy({ where: { user_id: userId }, force: true, transaction })
      }

      await user.destroy({ transaction })
      await transaction.commit()
      return true
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  /**
   * Changes the password of a user
   * @async
   * @param {string|number} userId - The ID of the user
   * @param {string} oldPassword - The current password of the user
   * @param {string} newPassword - The new password to set
   * @param {string} confirmPassword - The new password to confirm
   * @returns {Promise<boolean>} Returns true if password was changed successfully
   * @throws {Error} When user is not found
   * @throws {Error} When old password is invalid
   */
  async changePassword(userId, oldPassword, newPassword, confirmPassword) {
    try {
      const user = await this.UserModel.findByPk(userId)
      if (!user) throw new Error('User not found')

      const isValid = await bcrypt.compare(oldPassword, user.password)
      if (!isValid) throw new Error('Invalid password')

      if (newPassword !== confirmPassword) {
        throw new Error('newPassword and confirmPassword must be the same')
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      this.validatePassword(newPassword)

      user.password = hashedPassword
      await user.save()
      return true
    } catch (error) {
      console.error('Change password error:', error)
      throw error
    }
  }

  /**
   * Retrieves all users with the specified role from the database
   * @param {string} role - The role to filter users by
   * @returns {Promise<Array>} Array of user objects matching the role (passwords excluded)
   * @async
   */
  async getUsersByRole(role) {
    return await this.UserModel.findAll({
      where: { role },
      attributes: { exclude: ['password'] },
    })
  }

  /**
   * Retrieves all users associated with a specific school
   * @param {number} schoolId - The ID of the school to filter users by
   * @returns {Promise<Array>} A promise that resolves to an array of user objects (excluding passwords)
   */
  async getUsersBySchool(schoolId) {
    return await this.UserModel.findAll({
      where: { school_id: schoolId },
      attributes: { exclude: ['password'] },
    })
  }

  /**
   * Logs out a user by blacklisting their token and removing their refresh token
   * @async
   * @param {string} token - The JWT token to be blacklisted
   * @throws {Error} When BlacklistModel is not initialized or token is invalid
   * @returns {Promise<Object>} Object containing success message
   * @example
   * const result = await userService.logoutUser(token);
   * // returns { message: 'User logged out successfully' }
   */
  async logoutUser(token) {
    try {
      // Verify and decode the token to get the expiration time
      const decoded = jwt.verify(token, this.jwtSecret)

      // Calculate expiration date from jwt exp claim (which is in seconds)
      // If exp is not available, set a default expiration (e.g., 1 hour from now)
      const expiresAt = decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      // Add token to blacklist with expiration
      if (this.BlacklistModel) {
        await this.BlacklistModel.create({
          token,
          expiresAt,
        })
        if (decoded.id) {
          await this.UserModel.update({ refreshToken: null }, { where: { id: decoded.id } })
        }
      } else {
        throw new Error('BlacklistModel not initialized')
      }

      return { message: 'User logged out successfully' }
    } catch (error) {
      log.error('Logout error:', error)
      throw new Error('Invalid token or logout failed')
    }
  }

  /**
   * Generates a reset code for password recovery and saves it to the user's record.
   * @async
   * @param {string} email - The email address of the user requesting password reset
   * @returns {Promise<string>} The generated 6-digit reset code
   * @throws {Error} If user is not found with the provided email
   * @throws {Error} If there's an error during the password reset process
   */
  async forgotPassword(email, skipEmail = false) {
    try {
      const user = await this.UserModel.findOne({ where: { email } })
      if (!user) throw new Error('User not found')

      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expiryTime = new Date(Date.now() + 3 * 60 * 1000)

      user.reset_code = code
      user.reset_code_expiry = expiryTime
      await user.save()

      if (!skipEmail) {
        if (!transporter) {
          log.error('Email service not configured. Unable to send password reset code.')
          throw new Error('Email service unavailable')
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Password Reset Code',
          text: `Your password reset code is: ${code}. It will expire in 3 minutes.`,
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Password Reset</h2>
            <p>Your password reset code is:</p>
            <h1 style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px;">${code}</h1>
            <p>This code will expire in <strong>3 minutes</strong>.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        }

        await transporter.sendMail(mailOptions)
      } else {
        return code // Used for testing purposes only
      }
    } catch (error) {
      log.error('Forgot password error:', error)
      throw error
    }
  }

  /**
   * Verifies if the reset code matches the one stored for the user with the given email
   * @param {string} email - The email address of the user
   * @param {string} code - The reset code to verify
   * @returns {Promise<boolean>} Returns true if code matches and is not expired, throws error otherwise
   * @throws {Error} Throws error if user is not found, if code is invalid, or if code is expired
   */
  async verifyResetCode(email, code) {
    try {
      const user = await this.UserModel.findOne({ where: { email } })
      if (!user) throw new Error('User not found')

      if (user.reset_code !== code) {
        throw new Error('Invalid code')
      }

      if (new Date() > new Date(user.reset_code_expiry)) {
        user.reset_code = null
        user.reset_code_expiry = null
        await user.save()
        throw new Error('Reset code has expired')
      }

      return true
    } catch (error) {
      log.error('Confirm forgot password code error:', error)
      throw error
    }
  }

  /**
   * Resets a user's password using their email address
   * @async
   * @param {string} email - The email address of the user
   * @param {string} newPassword - The new password to set
   * @param {string} confirmPassword - The new password to confirm
   * @throws {Error} When user is not found
   * @throws {Error} When password validation fails
   * @returns {Promise<boolean>} Returns true if password was reset successfully
   */
  async resetPassword(email, newPassword, confirmPassword) {
    try {
      const user = await this.UserModel.findOne({ where: { email } })
      if (!user) throw new Error('User not found')

      if (newPassword !== confirmPassword) {
        throw new Error('newPassword and confirmPassword must be the same')
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      this.validatePassword(newPassword)

      user.password = hashedPassword
      user.reset_code = null
      user.reset_code_expiry = null
      await user.save()

      return true
    } catch (error) {
      log.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Retrieves all soft-deleted users from the database.
   * @async
   * @param {number} [page=1] - The page number to retrieve (defaults to 1)
   * @param {number} [limit=10] - The number of users per page (defaults to 10)
   * @returns {Promise<Object>} An object containing the deleted users and count
   * @returns {Array} returns.rows - Array of deleted user objects
   * @returns {number} returns.count - Total number of deleted users
   * @throws {Error} If an error occurs while retrieving deleted users
   */
  async getAllDeletedUsers(page = 1, limit = 10) {
    try {
      return await this.UserModel.findAndCountAll({
        where: { deleted_at: { [Op.ne]: null } }, // Use Op.ne to find non-null deleted_at
        limit,
        offset: (page - 1) * limit,
        paranoid: false, // Include soft-deleted records
        attributes: { exclude: ['password'] },
      });
    } catch (error) {
      log.error('Error retrieving deleted users:', error);
      throw error;
    }
  }

  /**
   * Soft deletes a user by their ID.
   * @param {number} userId - The ID of the user to delete.
   * @returns {Promise<Object>} The deleted user object.
   */
  async restoreUser(userId) {
    const transaction = await this.UserModel.sequelize.transaction();
    try {
      const user = await this.UserModel.findByPk(userId, { paranoid: false, transaction });
      if (!user) throw new Error('User not found');
  
      await user.restore({ transaction }); 
  
      await transaction.commit(); 
      return user;
    } catch (error) {
      await transaction.rollback(); 
      log.error('Restore user error:', error);
      throw error;
    }
  }
}

export default UserService

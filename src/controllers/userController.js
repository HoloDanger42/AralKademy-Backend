import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'
import dotenv from 'dotenv'
dotenv.config()

import UserService from '../services/userService.js'
import {
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
  Blacklist,
} from '../models/index.js'

const userService = new UserService(
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
  Blacklist
)

/**
 * Creates a new user.
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object.
 */
const createUser = async (req, res) => {
  console.log('Create user request:', req.body)
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      birth_date,
      contact_no,
      school_id,
      role,
      middle_initial,
    } = req.body

    const user = await userService.createUser(
      email,
      password,
      first_name,
      last_name,
      birth_date,
      contact_no,
      school_id,
      role,
      middle_initial
    )

    res.status(201).json({
      message: 'User created successfully',
      user,
    })
    log.info(`User ${email} created successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Create user for ${req.body.email || 'unknown user'}`,
      'Failed to create user'
    )
  }
}

/**
 * Retrieves all users.
 * @param {Object} _req - The request object (not used).
 * @param {Object} res - The response object.
 */
const getAllUsers = async (_req, res) => {
  try {
    const users = await userService.getAllUsers()
    const usersWithoutPassword = users.rows.map((user) => {
      const { password, ...userWithoutPassword } = user.get({
        plain: true,
      })
      return userWithoutPassword
    })

    res.status(200).json({
      count: users.count,
      users: usersWithoutPassword,
    })
    log.info('Retrieved all users')
  } catch (error) {
    return handleControllerError(error, res, 'Get all users', 'Failed to retrieve users')
  }
}

/**
 * Retrieves a user by ID.
 * @param {Object} req - The request object containing the user ID in req.params.
 * @param {Object} res - The response object.
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)
    res.status(200).json(user)
    log.info(`Retrieved user with ID ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get user by ID ${req.params.id}`,
      'Failed to retrieve user'
    )
  }
}

/**
 * Deletes a user from the system by their ID
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - User ID to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Returns a promise that resolves when user is deleted
 * @throws {Error} - Throws 404 if user not found or 500 for server errors
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const success = await userService.deleteUser(id)

    if (success) {
      res.status(200).json({ message: 'User deleted successfully' })
      log.info(`User with ID ${id} deleted`)
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete user ${req.params.id}`,
      'Failed to delete user'
    )
  }
}

/**
 * Handles forgot password requests.
 * @param {Object} req - The request object containing the user's email.
 * @param {Object} res - The response object.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    await userService.forgotPassword(email)
    res.status(200).json({ message: 'Password reset email sent successfully' })
    log.info(`Password reset email sent to ${email}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Forgot password for ${req.body.email || 'unknown email'}`,
      'Failed to send password reset email'
    )
  }
}

/**
 * Verifies the password reset code.
 * @param {Object} req - The request object containing the user's email and reset code.
 * @param {Object} res - The response object.
 */
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body
    await userService.verifyResetCode(email, code)
    res.status(200).json({ message: 'Code confirmed successfully' })
    log.info(`Code confirmed for ${email}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Verify reset code for ${req.body.email || 'unknown email'}`,
      'Failed to confirm code'
    )
  }
}

/**
 * Resets the user's password.
 * @param {Object} req - The request object containing the user's email and new password.
 * @param {Object} res - The response object.
 */
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    await userService.resetPassword(email, password)
    res.status(200).json({ message: 'Password reset successfully' })
    log.info(`Password reset for ${email}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Reset password for ${req.body.email || 'unknown email'}`,
      'Failed to reset password'
    )
  }
}

export {
  createUser,
  getAllUsers,
  getUserById,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  deleteUser,
}

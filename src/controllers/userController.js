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
      department,
      section,
      group_id,
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
      middle_initial,
      department,
      section,
      group_id,
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
const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const users = await userService.getAllUsers(page, limit)

    res.status(200).json({
      count: users.count,
      totalPages: Math.ceil(users.count / limit),
      currentPage: page,
      users: users.rows,
      roleCounts: users.roleCounts
    })
    
    log.info('Retrieved all users');
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
 * Changes the password of the user.
 * @param {Object} req - The request object containing the user ID and new password.
 * @param {Object} res - The response object.
 */
const changePassword = async (req, res) => {
  try {
    const { userId } = req.params
    const { oldPassword, newPassword, confirmPassword } = req.body
    await userService.changePassword(userId, oldPassword, newPassword, confirmPassword)
    res.status(200).json({ message: 'Password changed successfully' })
    log.info(`Password changed for user with ID ${userId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Change password for user with ID ${req.params.userId}`,
      'Failed to change password'
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
    const { email, skipEmail } = req.body // skipEmail is used for testing purposes only
    const code = await userService.forgotPassword(email, skipEmail)
    res.status(200).json({ message: 'Password reset email sent successfully', code: code })
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
    const { email, newPassword, confirmPassword } = req.body
    await userService.resetPassword(email, newPassword, confirmPassword)
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

/**
 * Retrieves all learners who are not currently assigned to any group.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAvailableLearners = async (req, res) => {
  try {
    const learners = await userService.getAvailableLearners()
    res.status(200).json(learners)
    log.info('Retrieved available learners')
  } catch (error) {
    return handleControllerError(error, res, 'Get available learners', 'Failed to retrieve learners')
  }
}

/**
 * Retrieves all student teachers who are not currently assigned to any group.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAvailableStudentTeachers = async (req, res) => {
  try {
    const studentTeachers = await userService.getAvailableStudentTeachers()
    res.status(200).json(studentTeachers)
    log.info('Retrieved available student teachers')
  } catch (error) {
    return handleControllerError(error, res, 'Get available student teachers', 'Failed to retrieve student teachers')
  }
}

/** 
 Updates a user.
 * @param {Object} req - The request object containing user ID and updated details.
 * @param {Object} res - The response object.
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const userData = req.body

    // Prevent setting admin role through this endpoint
    if (userData.role === 'admin') {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cannot set admin role through this endpoint',
        },
      })
    }

    // Validate role if provided
    if (userData.role && !['teacher', 'learner', 'student_teacher'].includes(userData.role)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role. Allowed roles are: teacher, student teacher, learner',
        },
      })
    }

    const updatedUser = await userService.updateUser(id, userData)

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    })

    log.info(`User with ID ${id} updated successfully`)
  } catch (error) {
    return handleControllerError(error, res, 'Update user ${req.params.id}', 'Failed to update user')
  }
}

/**
 * Restores a user that has been soft-deleted.
 * @param {Object} req - The request object containing the user ID.
 * @param {Object} res - The response object.
 */
const restoreUser = async (req, res) => {
  try {
    const { id } = req.params
    const user = await userService.restoreUser(id)
    res.status(200).json({ message: 'User restored successfully ', user })
    log.info(`User with ID ${id} restored successfully`)
  } catch (error) {
    return handleControllerError(error, res, 'Restore user', 'Failed to restore user')
  }
}

/**
 * Retrieves all deleted users.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllDeletedUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10

    const users = await userService.getAllDeletedUsers(page, limit)

    res.status(200).json({
      count: users.count,
      totalPages: Math.ceil(users.count / limit),
      currentPage: page,
      users: users.rows,
    })
    
    log.info('Retrieved all deleted users');
  } catch (error) {
    return handleControllerError(error, res, 'Get all deleted users', 'Failed to retrieve deleted users')
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
  getAvailableLearners,
  getAvailableStudentTeachers,
  updateUser,
  changePassword,
  restoreUser,
  getAllDeletedUsers,
}

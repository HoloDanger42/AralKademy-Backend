import express from 'express'
import {
  getAllUsers,
  getUserById,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  deleteUser,
  createUser,
} from '../controllers/userController.js'
import { checkRole } from '../middleware/roleMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private/Admin
 */
router.post('/', authMiddleware, checkRole(['admin']), createUser)

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', authMiddleware, checkRole(['admin']), getAllUsers)

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private/Admin
 */
router.get('/:id', authMiddleware, checkRole(['admin']), getUserById)

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', authMiddleware, checkRole(['admin']), deleteUser)

/**
 * @route POST /api/users/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post('/forgot-password', forgotPassword)

/**
 * @route POST /api/users/verify-reset-code
 * @desc Verify password reset code
 * @access Public
 */
router.post('/verify-reset-code', verifyResetCode)

/**
 * @route POST /api/users/reset-password
 * @desc Reset password with verification code
 * @access Public
 */
router.post('/reset-password', resetPassword)

export { router as usersRouter }

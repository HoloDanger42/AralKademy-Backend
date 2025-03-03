import express from 'express'
import { AuthController } from '../controllers/authController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', AuthController.login)

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate token
 * @access Private
 */
router.post('/logout', authMiddleware, AuthController.logout)

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', AuthController.refreshToken)

/**
 * @route GET /api/auth/validate
 * @desc Validate access token
 * @access Private
 */
router.get('/validate', authMiddleware, AuthController.validateToken)

export { router as authRouter }

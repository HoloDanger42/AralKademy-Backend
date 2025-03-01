import express from 'express'
import {
  login,
  logoutUser,
  getAllUsers,
  getUserById,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  deleteUser,
  createUser,
} from '../controllers/userController.js'
import { authLimiter } from '../middleware/securityMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const usersRouter = express.Router()

// --- Authentication ---
usersRouter.post('/login', authLimiter, login)
usersRouter.post('/logout', authMiddleware, logoutUser)
usersRouter.get('/', getAllUsers)
usersRouter.get('/:id', authMiddleware, getUserById)
usersRouter.patch('/forgot-password', forgotPassword)
usersRouter.patch('/verify-reset-code', verifyResetCode)
usersRouter.patch('/reset-password', resetPassword)

// --- User Management (all require authentication) ---
usersRouter.post('/', authMiddleware, createUser)
usersRouter.get('/', authMiddleware, getAllUsers)
usersRouter.get('/:id', authMiddleware, getUserById)
usersRouter.delete('/:id', authMiddleware, deleteUser)

export { usersRouter }

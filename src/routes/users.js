import express from 'express'
import { login, logoutUser, getAllUsers, getUserById, forgotPassword, verifyResetCode, resetPassword } from '../controllers/userController.js'
import { authLimiter } from '../middleware/securityMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const usersRouter = express.Router()

usersRouter.post('/login', authLimiter, login);
usersRouter.post('/logout', authMiddleware, logoutUser);
usersRouter.get('/', getAllUsers);
usersRouter.get('/:id', authMiddleware, getUserById);
usersRouter.patch('/forgot-password', forgotPassword);
usersRouter.patch('/verify-reset-code', verifyResetCode);
usersRouter.patch('/reset-password', resetPassword);


export { usersRouter }

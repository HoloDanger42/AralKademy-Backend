import express from 'express'
import { login, getAllUsers } from '../controllers/userController.js'
import { authLimiter } from '../middleware/securityMiddleware.js'

const usersRouter = express.Router()

usersRouter.post('/login', authLimiter, login)
usersRouter.get('/', getAllUsers)

export { usersRouter }

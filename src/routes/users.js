import express from 'express'
import { signup, login, getAllUsers } from '../controllers/userController.js'
import { authLimiter } from '../middleware/securityMiddleware.js'

const router = express.Router()

router.post('/signup', authLimiter, signup)
router.post('/login', authLimiter, login)
router.get('/', getAllUsers)

export default router

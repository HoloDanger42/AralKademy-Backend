import express from 'express'
import { AuthController } from '../controllers/authController.js'

const router = express.Router()

// Token refresh endpoint
router.post('/refresh', AuthController.refreshToken)

export const authRouter = router

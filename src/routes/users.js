// backend/src/routes/users.js
import express from 'express';
import { login, getAllUsers, getUserById } from '../controllers/userController.js';
import { authLimiter } from '../middleware/securityMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js'; // IMPORT authMiddleware

const usersRouter = express.Router();

usersRouter.post('/login', authLimiter, login); // Login route (with rate limiting)
usersRouter.get('/', getAllUsers);         // Get all users (you might want authMiddleware here too)
usersRouter.get('/:id', authMiddleware, getUserById); // Get user by ID (protected by authMiddleware)

export { usersRouter };

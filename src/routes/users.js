// routes/users.js
import express from 'express';
import { login, createUser, getAllUsers, getUserById, deleteUser } from '../controllers/userController.js'; // Import deleteUser
import { authLimiter } from '../middleware/securityMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const usersRouter = express.Router();

// --- Authentication ---
usersRouter.post('/login', authLimiter, login);

// --- User Management (all require authentication) ---
usersRouter.post('/', authMiddleware, createUser);
usersRouter.get('/', authMiddleware, getAllUsers);
usersRouter.get('/:id', authMiddleware, getUserById);
usersRouter.delete('/:id', authMiddleware, deleteUser); // Add this line!

export { usersRouter };
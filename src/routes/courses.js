// routes/courses.js
import express from 'express';
import {
    getAllCourses,
    createCourse,
    assignTeacherCourse, // Keep this one
    getCourseById,
    softDeleteCourse,
    updateCourse,
    deleteCourse
} from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const courseRouter = express.Router();

// GET /api/courses - Get all courses (protected by authMiddleware)
courseRouter.get('/', authMiddleware, getAllCourses);

// GET /api/courses/:id - Get a specific course by ID
courseRouter.get('/:id', authMiddleware, getCourseById);

// POST /api/courses - Create a new course (Admin only)
courseRouter.post('/', authMiddleware, createCourse);

// PUT /api/courses/:id - Update a course (Admin only)
courseRouter.put('/:id', authMiddleware, updateCourse);

// PATCH /api/courses/:id/soft-delete - Soft-delete a course (Admin only) - not yet implemented
courseRouter.patch('/:id/soft-delete', authMiddleware, softDeleteCourse);

// DELETE /api/courses/:id - Permanently delete a course (Admin only) - Added
courseRouter.delete('/:id', authMiddleware, deleteCourse);

// POST /api/courses/:id/assign-teacher - Assign a teacher to a course (Admin only) - potential transfer to groups.js - not yet implemented
courseRouter.post('/:id/assign-teacher', authMiddleware, assignTeacherCourse);

export { courseRouter };
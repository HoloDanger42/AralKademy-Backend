import express from 'express';
import { getAllCourses, createCourse, assignLearnerGroupCourse, assignStudentTeacherGroupCourse, assignTeacherCourse, getCourseById } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const coursesRouter = express.Router();

coursesRouter.get('/', authMiddleware, getAllCourses);
coursesRouter.get('/:courseId', authMiddleware, getCourseById);
coursesRouter.post('/', authMiddleware, createCourse);
coursesRouter.post('/assign-student-teacher-group', authMiddleware, assignStudentTeacherGroupCourse);
coursesRouter.post('/assign-learner-group', authMiddleware, assignLearnerGroupCourse);
coursesRouter.post('/assign-teacher', authMiddleware, assignTeacherCourse);

export { coursesRouter };
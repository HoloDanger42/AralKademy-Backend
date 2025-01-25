import express from 'express';
import { getAllCourses, createCourse, assignLearnerGroupCourse, assignStudentTeacherGroupCourse, assignTeacherCourse, getCourseById, softDeleteCourse, editCourse } from '../controllers/courseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const coursesRouter = express.Router();

coursesRouter.get('/', authMiddleware, getAllCourses);
coursesRouter.post('/', authMiddleware, createCourse);
coursesRouter.get('/:courseId', authMiddleware, getCourseById);
coursesRouter.delete('/:courseId', authMiddleware, softDeleteCourse);
coursesRouter.put('/:courseId', authMiddleware, editCourse);
coursesRouter.post('/assign-learner-group', authMiddleware, assignLearnerGroupCourse);
coursesRouter.post('/assign-teacher', authMiddleware, assignTeacherCourse);
coursesRouter.post('/assign-student-teacher-group', authMiddleware, assignStudentTeacherGroupCourse);

export { coursesRouter };
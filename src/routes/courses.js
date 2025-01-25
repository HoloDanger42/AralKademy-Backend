import express from 'express'
import { getAllCourses, createCourse, getCourseById } from '../controllers/courseController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const coursesRouter = express.Router()

coursesRouter.get('/', authMiddleware, getAllCourses)
coursesRouter.post('/', authMiddleware, createCourse)
coursesRouter.get('/:id', authMiddleware, getCourseById)

export { coursesRouter }

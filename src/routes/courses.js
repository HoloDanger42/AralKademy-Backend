import express from 'express'
import { getAllCourses, createCourse } from '../controllers/courseController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const coursesRouter = express.Router()

coursesRouter.get('/', authMiddleware, getAllCourses)
coursesRouter.post('/', authMiddleware, createCourse)

export { coursesRouter }

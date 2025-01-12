import express from 'express'
import { getAllCourses, createCourse } from '../controllers/courseController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', authMiddleware, getAllCourses)
router.post('/', authMiddleware, createCourse)

export default router

import express from 'express'
import { getAllEnrollments, enroll, getEnrollmentById, approveEnrollment, rejectEnrollment, getEnrollmentsBySchool } from '../controllers/enrollmentController.js'

const enrollmentsRouter = express.Router()

enrollmentsRouter.get('/', getAllEnrollments)
enrollmentsRouter.get('/:enrollmentId', getEnrollmentById)
enrollmentsRouter.post('/', enroll)
enrollmentsRouter.post('/approve', approveEnrollment)
enrollmentsRouter.post('/reject', rejectEnrollment)
enrollmentsRouter.get('/:schoolId', getEnrollmentsBySchool)

export { enrollmentsRouter }

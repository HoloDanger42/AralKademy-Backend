import express from 'express'
import { getAllEnrollments, enroll, getEnrollmentById, approveEnrollment, rejectEnrollment, getEnrollmentsBySchool, getEnrollmentStatus } from '../controllers/enrollmentController.js'

const enrollmentsRouter = express.Router()

enrollmentsRouter.get('/', getAllEnrollments)
enrollmentsRouter.post('/', enroll)
enrollmentsRouter.get('/:enrollmentId', getEnrollmentById)
enrollmentsRouter.put('/:enrollmentId/approve', approveEnrollment)
enrollmentsRouter.put('/:enrollmentId/reject', rejectEnrollment)
enrollmentsRouter.get('/school/:schoolId', getEnrollmentsBySchool)
enrollmentsRouter.get('/:enrollmentId/status', getEnrollmentStatus)

export { enrollmentsRouter }

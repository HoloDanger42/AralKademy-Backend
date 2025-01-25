import express from 'express'
import { getAllEnrollments, enroll, getEnrollmentById, approveEnrollment, rejectEnrollment } from '../controllers/enrollmentController.js'

const enrollmentsRouter = express.Router()

enrollmentsRouter.get('/', getAllEnrollments)
enrollmentsRouter.post('/', enroll)
enrollmentsRouter.get('/:id', getEnrollmentById)
enrollmentsRouter.put('/:id/approve', approveEnrollment)
enrollmentsRouter.put('/:id/reject', rejectEnrollment)
export { enrollmentsRouter }

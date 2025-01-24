import express from 'express'
import { getAllEnrollments, enroll } from '../controllers/enrollmentController.js'

const enrollmentsRouter = express.Router()

enrollmentsRouter.get('/', getAllEnrollments)
enrollmentsRouter.post('/', enroll)
export { enrollmentsRouter }

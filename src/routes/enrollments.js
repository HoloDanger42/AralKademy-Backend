// routes/enrollmentRoutes.js
import express from 'express';
import * as enrollmentController from '../controllers/enrollmentController.js';

const enrollmentRouter = express.Router();

enrollmentRouter.get('/', enrollmentController.getAllEnrollments);
enrollmentRouter.get('/:enrollmentId', enrollmentController.getEnrollmentById);
enrollmentRouter.post('/', enrollmentController.enroll);
enrollmentRouter.patch('/:enrollmentId/approve', enrollmentController.approveEnrollment);
enrollmentRouter.patch('/:enrollmentId/reject', enrollmentController.rejectEnrollment);
enrollmentRouter.get('/school/:schoolId', enrollmentController.getEnrollmentsBySchool);

// For checking status by email
enrollmentRouter.post('/check-status', enrollmentController.checkEnrollmentStatus); 

export { enrollmentRouter };
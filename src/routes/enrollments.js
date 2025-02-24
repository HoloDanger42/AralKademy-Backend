// routes/enrollments.js (or routes/enrollmentRoutes.js - consistent naming is good)
import express from 'express';
import * as enrollmentController from '../controllers/enrollmentController.js';

const enrollmentRouter = express.Router();

// GET /api/enrollments - Get all enrollments (likely for admins)
enrollmentRouter.get('/', enrollmentController.getAllEnrollments);

// GET /api/enrollments/:enrollmentId - Get a specific enrollment by ID
enrollmentRouter.get('/:enrollmentId', enrollmentController.getEnrollmentById);

// POST /api/enrollments - Create a new enrollment (your main enrollment form)
enrollmentRouter.post('/', enrollmentController.createEnrollment); // Renamed from 'enroll'

// PATCH /api/enrollments/:enrollmentId/approve - Approve an enrollment
enrollmentRouter.patch('/:enrollmentId/approve', enrollmentController.approveEnrollment);

// PATCH /api/enrollments/:enrollmentId/reject - Reject an enrollment
enrollmentRouter.patch('/:enrollmentId/reject', enrollmentController.rejectEnrollment);

// GET /api/enrollments/school/:schoolId - Get enrollments by school ID
enrollmentRouter.get('/school/:schoolId', enrollmentController.getEnrollmentsBySchool);

// POST /api/enrollments/check-status - Check enrollment status by email
enrollmentRouter.post('/check-status', enrollmentController.checkEnrollmentStatus);

// Add a route for updating an enrollment 
enrollmentRouter.put('/:enrollmentId', enrollmentController.updateEnrollment); //using PUT method

// DELETE route to delete an enrollment
enrollmentRouter.delete('/:enrollmentId', enrollmentController.deleteEnrollment);

export { enrollmentRouter };
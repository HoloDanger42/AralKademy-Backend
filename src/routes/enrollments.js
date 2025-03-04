import express from 'express'
import * as enrollmentController from '../controllers/enrollmentController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const enrollmentRouter = express.Router()

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Get all enrollments
 *     description: Retrieve a list of all enrollments (admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: A list of enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrollments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       enrollment_id:
 *                         type: integer
 *                         example: 1
 *                       email:
 *                         type: string
 *                         example: student@example.com
 *                       first_name:
 *                         type: string
 *                         example: John
 *                       last_name:
 *                         type: string
 *                         example: Doe
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                         example: pending
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 totalItems:
 *                   type: integer
 *                   example: 45
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.get('/', authMiddleware, enrollmentController.getAllEnrollments)

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     description: Submit a new enrollment application
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *               - birth_date
 *               - contact_no
 *               - school_id
 *               - year_level
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePassword123!"
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               middle_initial:
 *                 type: string
 *                 maxLength: 2
 *                 example: A
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "2010-01-15"
 *               contact_no:
 *                 type: string
 *                 example: "09123456789"
 *               school_id:
 *                 type: integer
 *                 example: 1
 *               year_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *                 example: 3
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment submitted successfully"
 *                 enrollment:
 *                   type: object
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "Email already exists."
 */
enrollmentRouter.post('/', enrollmentController.createEnrollment)

/**
 * @swagger
 * /enrollments/check-status:
 *   post:
 *     summary: Check enrollment status
 *     description: Check the status of an enrollment application by email
 *     tags: [Enrollments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: student@example.com
 *     responses:
 *       200:
 *         description: Enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [pending, approved, rejected]
 *                   example: pending
 *                 enrollment:
 *                   type: object
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.post('/check-status', enrollmentController.checkEnrollmentStatus)

/**
 * @swagger
 * /enrollments/school/{schoolId}:
 *   get:
 *     summary: Get enrollments by school
 *     description: Retrieve all enrollments for a specific school
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: integer
 *         description: School ID to filter by
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of enrollments for the school
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrollments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalItems:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: School not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.get(
  '/school/:schoolId',
  authMiddleware,
  enrollmentController.getEnrollmentsBySchool
)

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   get:
 *     summary: Get enrollment by ID
 *     description: Retrieve an enrollment by its ID
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enrollment_id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: student@example.com
 *                 first_name:
 *                   type: string
 *                   example: John
 *                 last_name:
 *                   type: string
 *                   example: Doe
 *                 middle_initial:
 *                   type: string
 *                   example: A
 *                 contact_no:
 *                   type: string
 *                   example: "09123456789"
 *                 birth_date:
 *                   type: string
 *                   format: date
 *                   example: "2010-01-15"
 *                 year_level:
 *                   type: integer
 *                   example: 3
 *                 school_id:
 *                   type: integer
 *                   example: 1
 *                 status:
 *                   type: string
 *                   enum: [pending, approved, rejected]
 *                   example: pending
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.get('/:enrollmentId', authMiddleware, enrollmentController.getEnrollmentById)

/**
 * @swagger
 * /enrollments/{enrollmentId}/approve:
 *   patch:
 *     summary: Approve an enrollment
 *     description: Approve a pending enrollment application (admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the enrollment to approve
 *     responses:
 *       200:
 *         description: Enrollment approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment approved successfully"
 *                 enrollment:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.patch(
  '/:enrollmentId/approve',
  authMiddleware,
  enrollmentController.approveEnrollment
)

/**
 * @swagger
 * /enrollments/{enrollmentId}/reject:
 *   patch:
 *     summary: Reject an enrollment
 *     description: Reject a pending enrollment application (admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the enrollment to reject
 *     responses:
 *       200:
 *         description: Enrollment rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment rejected successfully"
 *                 enrollment:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.patch(
  '/:enrollmentId/reject',
  authMiddleware,
  enrollmentController.rejectEnrollment
)

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   put:
 *     summary: Update an enrollment
 *     description: Update an existing enrollment record
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the enrollment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Updated
 *               last_name:
 *                 type: string
 *                 example: Name
 *               middle_initial:
 *                 type: string
 *                 maxLength: 2
 *                 example: B
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "2010-02-20"
 *               contact_no:
 *                 type: string
 *                 example: "09987654321"
 *               year_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 6
 *                 example: 4
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment updated successfully"
 *                 enrollment:
 *                   type: object
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: object
 */
enrollmentRouter.put('/:enrollmentId', authMiddleware, enrollmentController.updateEnrollment)

/**
 * @swagger
 * /enrollments/{enrollmentId}:
 *   delete:
 *     summary: Delete an enrollment
 *     description: Delete an enrollment record (soft delete)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the enrollment to delete
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Enrollment deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Enrollment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
enrollmentRouter.delete('/:enrollmentId', authMiddleware, enrollmentController.deleteEnrollment)

export { enrollmentRouter }

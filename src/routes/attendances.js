import express from 'express'
import {
    createAttendance,
    getAttendanceByCourseIdAndDate,
    setAttendanceStatus,
    getAttendanceByCourseIdAndUserId,
} from '../controllers/attendanceController.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const attendanceRouter = express.Router()

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Create a new attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - date
 *             properties:
 *               courseId:
 *                 type: integer
 *                 example: 1
 *                 description: "ID of the course"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2023-05-15"
 *                 description: "Date of the attendance record (YYYY-MM-DD)"
 *     responses:
 *       201:
 *         description: Attendance record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Attendance created successfully"
 *                 attendance:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Student Teacher or Teacher or Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
attendanceRouter.post('/', rbac.studentTeacherAndAbove, createAttendance)

/**
 * @swagger
 * /attendance/course/{courseId}/date/{date}:
 *   get:
 *     summary: Get attendance by course ID and date
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the course
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date of the attendance record (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Attendance record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Student Teacher or Teacher or Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error' 
 *       404:
 *         description: Attendance record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
attendanceRouter.get('/course/:courseId/date/:date', rbac.studentTeacherAndAbove, getAttendanceByCourseIdAndDate)

/**
 * @swagger
 * /attendance/{attendanceId}:
 *   patch:
 *     summary: Set attendance status
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the attendance record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [present, absent, late, excused]
 *                 example: "present"
 *                 description: "New status of the attendance"
 *     responses:
 *       200:
 *         description: Attendance status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Attendance status set successfully"
 *                 attendance:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Student Teacher or Teacher or Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attendance record not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
attendanceRouter.patch('/:attendanceId', rbac.studentTeacherAndAbove, setAttendanceStatus)

/**
 * @swagger
 * /attendance/course/{courseId}/user/{userId}:
 *   get:
 *     summary: Get attendance records by course ID and user ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the course
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the user (learner)
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Attendance records not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
attendanceRouter.get('/course/:courseId/user/:userId', rbac.allAuthenticated, getAttendanceByCourseIdAndUserId)

export { attendanceRouter }
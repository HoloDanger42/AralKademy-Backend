import express from 'express'
import {
    createAnnouncement,
    getAnnouncementsByCourseId,
    getGlobalAnnouncements,
    getAnnouncementById,
    getAnnouncementsByUserIdAndCourseId,
    getAnnouncementsByUserId,
    updateAnnouncement,
    deleteAnnouncement
} from '../controllers/announcementController.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const announcementRouter = express.Router()

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Create a new announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Important Update"
 *               message:
 *                 type: string
 *                 example: "There will be no classes tomorrow"
 *               course_id:
 *                 type: integer
 *                 example: 1
 *                 description: "Required for course-specific announcements"
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Announcement created successfully"
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
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
 *         description: Course not found (when courseId provided)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.post('/', rbac.studentTeacherAndAbove, createAnnouncement)

/**
 * @swagger
 * /announcements/course/{courseId}:
 *   get:
 *     summary: Get announcements by course ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of course announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
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
announcementRouter.get('/course/:courseId', rbac.allAuthenticated, getAnnouncementsByCourseId)

/**
 * @swagger
 * /announcements/global:
 *   get:
 *     summary: Get global announcements
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of global announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.get('/global', rbac.allAuthenticated, getGlobalAnnouncements)

/**
 * @swagger
 * /announcements/{announcementId}:
 *   get:
 *     summary: Get announcement by ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.get('/:announcementId', rbac.allAuthenticated, getAnnouncementById)

/**
 * @swagger
 * /announcements/user/{userId}/course/{courseId}:
 *   get:
 *     summary: Get announcements by user ID and course ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
 *     responses:
 *       200:
 *         description: List of user's announcements for specific course
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.get('/user/:userId/course/:courseId', rbac.studentTeacherAndAbove, getAnnouncementsByUserIdAndCourseId)

/**
 * @swagger
 * /announcements/user/{userId}:
 *   get:
 *     summary: Get announcements by user ID
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user's announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.get('/user/:userId', rbac.studentTeacherAndAbove, getAnnouncementsByUserId)

/**
 * @swagger
 * /announcements/{announcementId}:
 *   put:
 *     summary: Update an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *              - title
 *              - message
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Announcement Title"
 *               message:
 *                 type: string
 *                 example: "Updated announcement content"
 *               course_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Announcement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Announcement updated successfully"
 *                 announcement:
 *                   $ref: '#/components/schemas/Announcement'
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
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.put('/:announcementId', rbac.studentTeacherAndAbove, updateAnnouncement)

/**
 * @swagger
 * /announcements/{announcementId}:
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Announcement deleted successfully"
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
 *         description: Announcement not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
announcementRouter.delete('/:announcementId', rbac.studentTeacherAndAbove, deleteAnnouncement)

export { announcementRouter }
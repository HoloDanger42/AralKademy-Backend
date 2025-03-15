import express from 'express'
import {
  getAllGroups,
  createGroup,
  assignStudentTeacherMembers,
  assignLearnerMembers,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupMembers
} from '../controllers/groupController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const groupsRouter = express.Router()

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups
 *     description: Retrieve a list of all groups with optional filtering by group type
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: group_type
 *         schema:
 *           type: string
 *           enum: [student_teacher, learner]
 *         description: Filter groups by type
 *     responses:
 *       200:
 *         description: A list of groups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Group'
 *       400:
 *         description: Invalid group type
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
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.get('/', rbac.adminOnly, getAllGroups)

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     description: Create a new student teacher or learner group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - groupType
 *             properties:
 *               groupId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Grade 8 Science"
 *               groupType:
 *                 type: string
 *                 enum: [student_teacher, learner]
 *                 example: "learner"
 *     responses:
 *       201:
 *         description: Group created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group created successfully"
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       400:
 *         description: Missing required fields
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
 *       500:
 *         description: Failed to create group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.post('/', rbac.adminOnly, createGroup)

/**
 * @swagger
 * /groups/assign-student-teachers:
 *   post:
 *     summary: Assign student teachers to a group
 *     description: Add multiple student teachers to a specific group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - userIds
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *               userIds:
 *                 type: array
 *                 description: Array of student teacher user IDs
 *                 items:
 *                   type: integer
 *                 example: [5, 7, 9]
 *     responses:
 *       200:
 *         description: Student teachers assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Student teachers assigned successfully"
 *                 studentTeachers:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required fields
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
 *       500:
 *         description: Failed to assign student teachers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.post('/assign-student-teachers', rbac.adminOnly, assignStudentTeacherMembers)

/**
 * @swagger
 * /groups/assign-learners:
 *   post:
 *     summary: Assign learners to a group
 *     description: Add multiple learners to a specific group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupId
 *               - userIds
 *             properties:
 *               groupId:
 *                 type: integer
 *                 description: ID of the group
 *                 example: 1
 *               userIds:
 *                 type: array
 *                 description: Array of learner user IDs
 *                 items:
 *                   type: integer
 *                 example: [10, 11, 12]
 *     responses:
 *       200:
 *         description: Learners assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Learners assigned successfully"
 *                 learners:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing required fields
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
 *       500:
 *         description: Failed to assign learners
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.post('/assign-learners', rbac.adminOnly, assignLearnerMembers)

/**
 * @swagger
 * /groups/{groupId}:
 *   get:
 *     summary: Get a group by ID
 *     description: Retrieve a specific group by its ID
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to retrieve group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.get('/:groupId', rbac.studentTeacherAndAbove, getGroupById)

/**
 * @swagger
 * /groups/{groupId}:
 *   put:
 *     summary: Update a group
 *     description: Update a group's information including name and members
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Group Name"
 *               groupType:
 *                 type: string
 *                 enum: [student_teacher, learner]
 *                 example: "student_teacher"
 *               addUserIds:
 *                 type: array
 *                 description: User IDs to add to the group
 *                 items:
 *                   type: integer
 *                 example: [5, 6]
 *               removeUserIds:
 *                 type: array
 *                 description: User IDs to remove from the group
 *                 items:
 *                   type: integer
 *                 example: [3, 4]
 *     responses:
 *       200:
 *         description: Group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group updated successfully"
 *                 group:
 *                   $ref: '#/components/schemas/Group'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to update group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.put('/:groupId', rbac.adminOnly, updateGroup)

/**
 * @swagger
 * /groups/{groupId}:
 *   delete:
 *     summary: Delete a group
 *     description: Permanently delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID to delete
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Group deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to delete group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.delete('/:groupId', rbac.adminOnly, deleteGroup)

/**
 * @swagger
 * /groups/{groupId}/members:
 *   get:
 *     summary: Get members of a group
 *     description: Retrieve the members of a specific group based on the group's type
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Group ID
 *     responses:
 *       200:
 *         description: A list of group members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User' // Assuming you have a User schema defined
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to retrieve group members
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
groupsRouter.get('/:groupId/members', rbac.allAuthenticated, getGroupMembers)

export { groupsRouter }

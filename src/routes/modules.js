<<<<<<< HEAD
import express from 'express'
import {
  createModule,
  getModuleById,
  getModulesByCourseId,
  updateModule,
  deleteModule,
  addModuleContent,
  addModuleFileContent,
  updateModuleContent,
  deleteModuleContent,
  getContentsByModuleId,
  getModuleGradeOfUser,
  unlockNextModuleForLearner,
} from '../controllers/moduleController.js'
import { rbac } from '../middleware/rbacMiddleware.js'
import upload from '../config/multerConfig.js'

const moduleRouter = express.Router()

/**
 * @swagger
 * /modules/course/{courseId}:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Module One"
 *               description:
 *                 type: string
 *                 example: "Learn advanced web development techniques"
 *     responses:
 *       201:
 *         description: Module created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module created successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
moduleRouter.post('/course/:courseId', rbac.studentTeacherAndAbove, createModule)

/**
 * @swagger
 * /modules/{moduleId}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId', rbac.allAuthenticated, getModuleById)

/**
 * @swagger
 * /modules/course/{courseId}:
 *   get:
 *     summary: Get modules by course ID
 *     tags: [Modules]
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
 *         description: List of modules of a course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
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
moduleRouter.get('/course/:courseId', rbac.allAuthenticated, getModulesByCourseId)

/**
 * @swagger
 * /modules/{moduleId}:
 *   put:
 *     summary: Update a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Module Name"
 *               description:
 *                 type: string
 *                 example: "Updated module description"
 *     responses:
 *       200:
 *         description: Module updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module updated successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.put('/:moduleId', rbac.studentTeacherAndAbove, updateModule)

/**
 * @swagger
 * /modules/{moduleId}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module deleted successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.delete('/:moduleId', rbac.studentTeacherAndAbove, deleteModule)

/**
 * @swagger
 * /modules/{moduleId}/content/upload:
 *   post:
 *     summary: Upload a content file to a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               contentFile:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 example: "Lecture Slides Week 1"
 *     responses:
 *       201:
 *         description: File uploaded and content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid input, file type, or file size exceeded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Module not found
 */
moduleRouter.post(
  '/:moduleId/content/upload',
  rbac.studentTeacherAndAbove,
  upload.single('contentFile'),
  addModuleFileContent
)

/**
 * @swagger
 * /modules/{moduleId}/content:
 *   post:
 *     summary: Add a new content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - link
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Chapter 1"
 *               link:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *     responses:
 *       201:
 *         description: Content added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content added successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.post('/:moduleId/content', rbac.studentTeacherAndAbove, addModuleContent)

/**
 * @swagger
 * /modules/content/{contentId}:
 *   put:
 *     summary: Update a content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - link
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Content Name"
 *               link:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=Ol9CCM240Ag"
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content updated successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.put('/content/:contentId', rbac.studentTeacherAndAbove, updateModuleContent)

/**
 * @swagger
 * /modules/content/{contentId}:
 *   delete:
 *     summary: Delete a content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content deleted successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.delete('/content/:contentId', rbac.studentTeacherAndAbove, deleteModuleContent)

/**
 * @swagger
 * /modules/{moduleId}/contents:
 *   get:
 *     summary: Get contents by module ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: List of contents of a module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId/contents', rbac.allAuthenticated, getContentsByModuleId)

/**
 * @swagger
 * /modules/{moduleId}/module-grade:
 *   get:
 *     summary: Get the module grade of a user
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the module
 *     responses:
 *       200:
 *         description: User's module grade information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allGraded:
 *                   type: boolean
 *                   example: true
 *                 allPassed:
 *                   type: boolean
 *                   example: false
 *                 averageScore:
 *                   type: number
 *                   format: float
 *                   example: 85.5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId/module-grade', rbac.allAuthenticated, getModuleGradeOfUser)

/**
 * @swagger
 * /modules/{currentModuleId}/learners/{learnerId}/unlock-next:
 *   post:
 *     summary: Manually unlock the next module for a learner
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: currentModuleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the module the learner is currently on (or stuck on).
 *       - in: path
 *         name: learnerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the learner for whom the next module will be unlocked.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Learner demonstrated understanding through alternative means."
 *     responses:
 *       200:
 *         description: Next module unlocked successfully or already unlocked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Next module unlocked successfully."
 *                 unlockedModule:
 *                   $ref: '#/components/schemas/Module'
 *                 override:
 *                   $ref: '#/components/schemas/ModuleUnlockOverride'
 *       400:
 *         description: Invalid input data (e.g., current module is the last module).
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
 *         description: Forbidden - Teacher, Student Teacher or Admin access required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Learner, current module, or course not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.post(
  '/:currentModuleId/learners/:learnerId/unlock-next',
  rbac.studentTeacherAndAbove,
  unlockNextModuleForLearner
)

export { moduleRouter }
=======
import express from 'express'
import {
  createModule,
  getModuleById,
  getModulesByCourseId,
  updateModule,
  deleteModule,
  addModuleContent,
  addModuleFileContent,
  updateModuleContent,
  deleteModuleContent,
  getContentsByModuleId,
  getModuleGradeOfUser,
  unlockNextModuleForLearner,
} from '../controllers/moduleController.js'
import { rbac } from '../middleware/rbacMiddleware.js'
import upload from '../config/multerConfig.js'

const moduleRouter = express.Router()

/**
 * @swagger
 * /modules/course/{courseId}:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Module One"
 *               description:
 *                 type: string
 *                 example: "Learn advanced web development techniques"
 *     responses:
 *       201:
 *         description: Module created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module created successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
moduleRouter.post('/course/:courseId', rbac.studentTeacherAndAbove, createModule)

/**
 * @swagger
 * /modules/{moduleId}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Module'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId', rbac.allAuthenticated, getModuleById)

/**
 * @swagger
 * /modules/course/{courseId}:
 *   get:
 *     summary: Get modules by course ID
 *     tags: [Modules]
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
 *         description: List of modules of a course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modules:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Module'
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
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
moduleRouter.get('/course/:courseId', rbac.allAuthenticated, getModulesByCourseId)

/**
 * @swagger
 * /modules/{moduleId}:
 *   put:
 *     summary: Update a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Module Name"
 *               description:
 *                 type: string
 *                 example: "Updated module description"
 *     responses:
 *       200:
 *         description: Module updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module updated successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.put('/:moduleId', rbac.studentTeacherAndAbove, updateModule)

/**
 * @swagger
 * /modules/{moduleId}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Module deleted successfully"
 *                 module:
 *                   $ref: '#/components/schemas/Module'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.delete('/:moduleId', rbac.studentTeacherAndAbove, deleteModule)

/**
 * @swagger
 * /modules/{moduleId}/content/upload:
 *   post:
 *     summary: Upload a content file to a module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               contentFile:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *                 example: "Lecture Slides Week 1"
 *     responses:
 *       201:
 *         description: File uploaded and content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File uploaded successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
 *       400:
 *         description: Invalid input, file type, or file size exceeded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Module not found
 */
moduleRouter.post(
  '/:moduleId/content/upload',
  rbac.studentTeacherAndAbove,
  upload.single('contentFile'),
  addModuleFileContent
)

/**
 * @swagger
 * /modules/{moduleId}/content:
 *   post:
 *     summary: Add a new content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - link
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Chapter 1"
 *               link:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *     responses:
 *       201:
 *         description: Content added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content added successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.post('/:moduleId/content', rbac.studentTeacherAndAbove, addModuleContent)

/**
 * @swagger
 * /modules/content/{contentId}:
 *   put:
 *     summary: Update a content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - link
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Content Name"
 *               link:
 *                 type: string
 *                 example: "https://www.youtube.com/watch?v=Ol9CCM240Ag"
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content updated successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.put('/content/:contentId', rbac.studentTeacherAndAbove, updateModuleContent)

/**
 * @swagger
 * /modules/content/{contentId}:
 *   delete:
 *     summary: Delete a content
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Content deleted successfully"
 *                 content:
 *                   $ref: '#/components/schemas/Content'
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
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.delete('/content/:contentId', rbac.studentTeacherAndAbove, deleteModuleContent)

/**
 * @swagger
 * /modules/{moduleId}/contents:
 *   get:
 *     summary: Get contents by module ID
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Module ID
 *     responses:
 *       200:
 *         description: List of contents of a module
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *                 totalItems:
 *                   type: integer
 *                   example: 25
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId/contents', rbac.allAuthenticated, getContentsByModuleId)

/**
 * @swagger
 * /modules/{moduleId}/module-grade:
 *   get:
 *     summary: Get the module grade of a user
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the module
 *     responses:
 *       200:
 *         description: User's module grade information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allGraded:
 *                   type: boolean
 *                   example: true
 *                 allPassed:
 *                   type: boolean
 *                   example: false
 *                 averageScore:
 *                   type: number
 *                   format: float
 *                   example: 85.5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User or module not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.get('/:moduleId/module-grade', rbac.allAuthenticated, getModuleGradeOfUser)

/**
 * @swagger
 * /modules/{currentModuleId}/learners/{learnerId}/unlock-next:
 *   post:
 *     summary: Manually unlock the next module for a learner
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: currentModuleId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the module the learner is currently on (or stuck on).
 *       - in: path
 *         name: learnerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the learner for whom the next module will be unlocked.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Learner demonstrated understanding through alternative means."
 *     responses:
 *       200:
 *         description: Next module unlocked successfully or already unlocked.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Next module unlocked successfully."
 *                 unlockedModule:
 *                   $ref: '#/components/schemas/Module'
 *                 override:
 *                   $ref: '#/components/schemas/ModuleUnlockOverride'
 *       400:
 *         description: Invalid input data (e.g., current module is the last module).
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
 *         description: Forbidden - Teacher, Student Teacher or Admin access required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Learner, current module, or course not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
moduleRouter.post(
  '/:currentModuleId/learners/:learnerId/unlock-next',
  rbac.studentTeacherAndAbove,
  unlockNextModuleForLearner
)

export { moduleRouter }
>>>>>>> 627466f638de697919d077ca56524377d406840d

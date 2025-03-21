import express from 'express'
import {
  createAssessment,
  getAssessmentById,
  getAssessmentsForCourse,
  addQuestion,
  startSubmission,
  saveAnswer,
  submitAssessment,
  getSubmissionsForAssessment,
  getStudentSubmission,
  gradeSubmission,
} from '../controllers/assessmentController.js'
import { validateRequest } from '../middleware/validationMiddleware.js'
import { assessmentSchemas } from '../validations/assessmentSchemas.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const router = express.Router()

/**
 * @swagger
 * /assessments:
 *   post:
 *     summary: Create a new assessment
 *     tags: [Assessments]
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
 *               - course_id
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Midterm Exam"
 *               description:
 *                 type: string
 *                 example: "Comprehensive midterm covering chapters 1-5"
 *               course_id:
 *                 type: integer
 *                 example: 1
 *               type:
 *                 type: string
 *                 enum: [quiz, assignment, exam]
 *                 example: "exam"
 *               max_score:
 *                 type: integer
 *                 example: 100
 *               passing_score:
 *                 type: integer
 *                 example: 70
 *               duration_minutes:
 *                 type: integer
 *                 example: 90
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-05-15T23:59:59Z"
 *               is_published:
 *                 type: boolean
 *                 example: false
 *               instructions:
 *                 type: string
 *                 example: "Answer all questions. You may use a calculator."
 *     responses:
 *       201:
 *         description: Assessment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Assessment created successfully"
 *                 assessment:
 *                   $ref: '#/components/schemas/Assessment'
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
 *         description: Forbidden - requires student teacher, teacher, or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/',
  rbac.studentTeacherAndAbove,
  validateRequest(assessmentSchemas.createAssessment),
  createAssessment
)

/**
 * @swagger
 * /assessments/course/{courseId}:
 *   get:
 *     summary: Get all assessments for a course
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Course ID
 *       - in: query
 *         name: includeQuestions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include question details
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of assessments for the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 assessments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assessment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     pages:
 *                       type: integer
 *                       example: 2
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
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
router.get(
  '/course/:courseId',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.getAssessmentsForCourse),
  getAssessmentsForCourse
)

/**
 * @swagger
 * /assessments/{assessmentId}:
 *   get:
 *     summary: Get assessment by ID
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *       - in: query
 *         name: includeQuestions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include questions
 *       - in: query
 *         name: teacherView
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to show correct answers (teachers only)
 *     responses:
 *       200:
 *         description: Assessment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 assessment:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Assessment'
 *                     - type: object
 *                       properties:
 *                         questions:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/Question'
 *                               - type: object
 *                                 properties:
 *                                   options:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/QuestionOption'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:assessmentId',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.getAssessmentById),
  getAssessmentById
)

/**
 * @swagger
 * /assessments/{assessmentId}/questions:
 *   post:
 *     summary: Add a question to an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_text
 *               - question_type
 *             properties:
 *               question_text:
 *                 type: string
 *                 example: "What is the capital of France?"
 *               question_type:
 *                 type: string
 *                 enum: [multiple_choice, true_false, short_answer, essay]
 *                 example: "multiple_choice"
 *               points:
 *                 type: integer
 *                 example: 5
 *               order_index:
 *                 type: integer
 *                 example: 1
 *               media_url:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               options:
 *                 type: array
 *                 description: Required only for multiple_choice or true_false
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "Paris"
 *                     is_correct:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       201:
 *         description: Question added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Question added successfully"
 *                 question:
 *                   $ref: '#/components/schemas/Question'
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
 *         description: Forbidden - requires student teacher, teacher, or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:assessmentId/questions',
  rbac.studentTeacherAndAbove,
  validateRequest(assessmentSchemas.addQuestion),
  addQuestion
)

/**
 * @swagger
 * /assessments/{assessmentId}/submissions:
 *   post:
 *     summary: Start a new submission for an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Submission started successfully"
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Invalid request
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
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/:assessmentId/submissions',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.startSubmission),
  startSubmission
)

/**
 * @swagger
 * /assessments/submissions/{submissionId}/questions/{questionId}/answers:
 *   post:
 *     summary: Save an answer for a question in a submission
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Question ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - properties:
 *                   optionId:
 *                     type: integer
 *                     example: 1
 *               - properties:
 *                   textResponse:
 *                     type: string
 *                     example: "Paris is the capital of France"
 *     responses:
 *       200:
 *         description: Answer saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Answer saved successfully"
 *                 answer:
 *                   $ref: '#/components/schemas/AnswerResponse'
 *       400:
 *         description: Invalid answer format
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
 *         description: User doesn't own this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission or question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/submissions/:submissionId/questions/:questionId/answers',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.saveAnswer),
  saveAnswer
)

/**
 * @swagger
 * /assessments/submissions/{submissionId}/submit:
 *   post:
 *     summary: Submit a completed assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Assessment submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Assessment submitted successfully"
 *                 submission:
 *                   $ref: '#/components/schemas/Submission'
 *                 score:
 *                   type: object
 *                   properties:
 *                     points:
 *                       type: integer
 *                       example: 85
 *                     max_points:
 *                       type: integer
 *                       example: 100
 *                     percentage:
 *                       type: number
 *                       format: float
 *                       example: 85.0
 *                     pass:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: User doesn't own this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Assessment already submitted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/submissions/:submissionId/submit',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.submitAssessment),
  submitAssessment
)

/**
 * @swagger
 * /assessments/{assessmentId}/submissions:
 *   get:
 *     summary: Get all submissions for an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of submissions for the assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submissions:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Submission'
 *                       - type: object
 *                         properties:
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 30
 *                     pages:
 *                       type: integer
 *                       example: 2
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - requires teacher or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assessment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:assessmentId/submissions',
  rbac.studentTeacherAndAbove,
  validateRequest(assessmentSchemas.getSubmissionsForAssessment),
  getSubmissionsForAssessment
)

/**
 * @swagger
 * /assessments/{assessmentId}/my-submission:
 *   get:
 *     summary: Get the current user's submission for an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assessmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Assessment ID
 *       - in: query
 *         name: includeAnswers
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include user's answers
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User's submission for the assessment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 submission:
 *                   type: object
 *                   allOf:
 *                     - $ref: '#/components/schemas/Submission'
 *                     - type: object
 *                       properties:
 *                         answers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AnswerResponse'
 *                 assessment:
 *                   $ref: '#/components/schemas/Assessment'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Assessment or submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/:assessmentId/my-submission',
  rbac.allAuthenticated,
  validateRequest(assessmentSchemas.getStudentSubmission),
  getStudentSubmission
)

/**
 * @swagger
 * /assessments/submissions/{submissionId}/grade:
 *   post:
 *     summary: Grade a submission
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grades
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - points
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                       example: 1
 *                     points:
 *                       type: integer
 *                       example: 8
 *                     feedback:
 *                       type: string
 *                       example: "Good job!"
 *               feedback:
 *                 type: string
 *                 example: "Overall excellent work."
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Submission graded successfully"
 *                 submission:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Submission'
 *                     - type: object
 *                       properties:
 *                         answers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/AnswerResponse'
 *       400:
 *         description: Invalid grading data
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
 *         description: Forbidden - requires teacher or admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/submissions/:submissionId/grade',
  rbac.studentTeacherAndAbove,
  validateRequest(assessmentSchemas.gradeSubmission),
  gradeSubmission
)

export { router as assessmentRouter }

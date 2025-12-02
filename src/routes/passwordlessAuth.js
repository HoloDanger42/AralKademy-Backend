<<<<<<< HEAD
import express from 'express'
import { PasswordlessAuthController } from '../controllers/passwordlessAuthController.js'
import { validate } from '../middleware/validationMiddleware.js'
import { passwordlessAuthSchemas } from '../schemas/passwordlessAuthSchemas.js'
import { authLimiter } from '../middleware/securityMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const router = express.Router()

// Apply rate limiting to passwordless auth routes
router.use(authLimiter)

/**
 * @swagger
 * /auth/passwordless/magic-link:
 *   post:
 *     summary: Request a magic link for passwordless login (teachers/admins)
 *     tags: [Passwordless Auth]
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
 *                 example: teacher@example.com
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
router.post(
  '/magic-link',
  validate(passwordlessAuthSchemas.magicLinkRequest),
  PasswordlessAuthController.requestMagicLink
)

/**
 * @swagger
 * /auth/passwordless/numeric-code:
 *   post:
 *     summary: Generate a numeric code for student login (grades 4-6)
 *     tags: [Passwordless Auth]
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
 *         description: Numeric code generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Student not found
 */
router.post(
  '/numeric-code',
  authMiddleware, // Require authentication
  rbac.studentTeacherAndAbove,
  validate(passwordlessAuthSchemas.codeRequest),
  PasswordlessAuthController.requestNumericCode
)

/**
 * @swagger
 * /auth/passwordless/picture-code:
 *   post:
 *     summary: Generate a picture code for youngest students (grades 1-3)
 *     tags: [Passwordless Auth]
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
 *         description: Picture code generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Student not found
 */
router.post(
  '/picture-code',
  authMiddleware, // Require authentication
  rbac.studentTeacherAndAbove,
  validate(passwordlessAuthSchemas.codeRequest),
  PasswordlessAuthController.requestPictureCode
)

/**
 * @swagger
 * /auth/passwordless/verify:
 *   post:
 *     summary: Verify token (any type) and log in
 *     tags: [Passwordless Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or expired token
 */
router.post(
  '/verify',
  validate(passwordlessAuthSchemas.tokenVerification),
  PasswordlessAuthController.verifyToken
)

export { router as passwordlessAuthRouter }
=======
import express from 'express'
import { PasswordlessAuthController } from '../controllers/passwordlessAuthController.js'
import { validate } from '../middleware/validationMiddleware.js'
import { passwordlessAuthSchemas } from '../schemas/passwordlessAuthSchemas.js'
import { authLimiter } from '../middleware/securityMiddleware.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { rbac } from '../middleware/rbacMiddleware.js'

const router = express.Router()

// Apply rate limiting to passwordless auth routes
router.use(authLimiter)

/**
 * @swagger
 * /auth/passwordless/magic-link:
 *   post:
 *     summary: Request a magic link for passwordless login (teachers/admins)
 *     tags: [Passwordless Auth]
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
 *                 example: teacher@example.com
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 */
router.post(
  '/magic-link',
  validate(passwordlessAuthSchemas.magicLinkRequest),
  PasswordlessAuthController.requestMagicLink
)

/**
 * @swagger
 * /auth/passwordless/numeric-code:
 *   post:
 *     summary: Generate a numeric code for student login (grades 4-6)
 *     tags: [Passwordless Auth]
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
 *         description: Numeric code generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Student not found
 */
router.post(
  '/numeric-code',
  authMiddleware, // Require authentication
  rbac.studentTeacherAndAbove,
  validate(passwordlessAuthSchemas.codeRequest),
  PasswordlessAuthController.requestNumericCode
)

/**
 * @swagger
 * /auth/passwordless/picture-code:
 *   post:
 *     summary: Generate a picture code for youngest students (grades 1-3)
 *     tags: [Passwordless Auth]
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
 *         description: Picture code generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Student not found
 */
router.post(
  '/picture-code',
  authMiddleware, // Require authentication
  rbac.studentTeacherAndAbove,
  validate(passwordlessAuthSchemas.codeRequest),
  PasswordlessAuthController.requestPictureCode
)

/**
 * @swagger
 * /auth/passwordless/verify:
 *   post:
 *     summary: Verify token (any type) and log in
 *     tags: [Passwordless Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: a1b2c3d4e5f6
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or expired token
 */
router.post(
  '/verify',
  validate(passwordlessAuthSchemas.tokenVerification),
  PasswordlessAuthController.verifyToken
)

export { router as passwordlessAuthRouter }
>>>>>>> 627466f638de697919d077ca56524377d406840d

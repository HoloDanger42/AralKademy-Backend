import EnrollmentService from '../services/enrollmentService.js'
import { Enrollment } from '../models/Enrollment.js'
import { School } from '../models/School.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

const enrollmentService = new EnrollmentService(Enrollment, School)

/**
 * Creates a new enrollment.
 * @param {Object} req - The request object containing enrollment details.
 * @param {Object} res - The response object.
 */
const createEnrollment = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      middle_initial,
      last_name,
      birth_date,
      contact_no,
      school_id,
      year_level,
      status,
      confirm_password,
    } = req.body

    const errors = {}

    // 1. Password validation
    if (!confirm_password || password !== confirm_password) {
      errors.confirm_password = 'Passwords do not match.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
      errors.password = 'Password must contain at least one number and one symbol.'
    }

    // 2. Contact Number Pre-processing + Basic Check
    if (!contact_no) {
      errors.contact_no = 'Contact number is required.'
    } else {
      const cleanedContactNo = contact_no.replace(/[-\s()]/g, '') // Remove hyphens, spaces, parentheses
      if (!/^(?:\+63|0)9\d{9}$/.test(cleanedContactNo)) {
        errors.contact_no = 'Invalid contact number format. Must start with 09 and have 11 digits.'
      }
    }

    // Other validations
    if (!first_name) errors.first_name = 'First name is required.'
    if (!last_name) errors.last_name = 'Last name is required.'
    if (!email) errors.email = 'Email is required.'
    if (!birth_date) errors.birth_date = 'Birth date is required.'
    if (!school_id) errors.school_id = 'School ID is required.'
    if (!year_level) errors.year_level = 'Year level is required.'
    if (middle_initial && middle_initial.length > 2)
      errors.middle_initial = 'Middle Initial is maximum of 2 characters only.'

    if (Object.keys(errors).length > 0) {
      log.error('Validation errors while creating enrollment:', errors)
      return res.status(400).json({ errors })
    }

    // Capitalize names
    const capitalizedFirstName = first_name.charAt(0).toUpperCase() + first_name.slice(1)
    const capitalizedLastName = last_name.charAt(0).toUpperCase() + last_name.slice(1)
    const capitalizedMiddleInitial = middle_initial
      ? middle_initial.charAt(0).toUpperCase() + middle_initial.slice(1)
      : ''

    // Create enrollment
    const enrollment = await enrollmentService.createEnrollment({
      email,
      password,
      first_name: capitalizedFirstName,
      middle_initial: capitalizedMiddleInitial,
      last_name: capitalizedLastName,
      birth_date,
      contact_no: contact_no.replace(/[-\s()]/g, ''), // Pass CLEANED contact number
      school_id,
      year_level,
      status,
    })

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollment,
    })

    log.info(`Enrollment created successfully`)
  } catch (error) {
    return handleControllerError(error, res, 'Create enrollment', 'Failed to create enrollment')
  }
}

/**
 * Approves an enrollment.
 * @param {Object} req - The request object containing the enrollment ID in req.params.
 * @param {Object} res - The response object.
 */
const approveEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId
    const adminId = req.user.id
    const enrollment = await enrollmentService.approveEnrollment(enrollmentId, adminId)
    res.status(200).json(enrollment)
    log.info(`Enrollment with ID: ${enrollmentId} was approved`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Approve enrollment ${req.params.enrollmentId}`,
      'Failed to approve enrollment'
    )
  }
}

/**
 * Rejects an enrollment.
 * @param {Object} req - The request object containing the enrollment ID in req.params.
 * @param {Object} res - The response object.
 */
const rejectEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId
    const adminId = req.user.id
    const enrollment = await enrollmentService.rejectEnrollment(enrollmentId, adminId)
    res.status(200).json(enrollment)
    log.info(`Enrollment with ID: ${enrollmentId} was rejected`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Reject enrollment ${req.params.enrollmentId}`,
      'Failed to reject enrollment'
    )
  }
}

/**
 * Retrieves an enrollment by ID.
 * @param {Object} req - The request object containing the enrollment ID in req.params.
 * @param {Object} res - The response object.
 */
const getEnrollmentById = async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId)
    res.status(200).json(enrollment)
    log.info(`Retrieved enrollment with ID: ${enrollmentId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get enrollment by ID ${req.params.enrollmentId}`,
      'Failed to retrieve enrollment'
    )
  }
}

/**
 * Retrieves all enrollments.
 * @param {Object} _req - The request object (not used).
 * @param {Object} res - The response object.
 */
const getAllEnrollments = async (_req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments()
    res.status(200).json(enrollments)
    log.info('Retrieved all enrollments')
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Get all enrollments',
      'Failed to retrieve enrollments'
    )
  }
}

/**
 * Retrieves enrollments by school ID.
 * @param {Object} req - The request object containing the school ID in req.params.
 * @param {Object} res - The response object.
 */
const getEnrollmentsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params
    const enrollments = await enrollmentService.getEnrollmentsBySchool(schoolId)
    res.status(200).json(enrollments)
    log.info(`Retrieved enrollments for school ID: ${schoolId}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get enrollments by school ${req.params.schoolId}`,
      'Failed to retrieve enrollments by schools'
    )
  }
}

/**
 * Checks the enrollment status by email.
 * @param {Object} req - The request object containing the email in req.body.
 * @param {Object} res - The response object.
 */
const checkEnrollmentStatus = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const status = await enrollmentService.checkEnrollmentStatus(email)

    if (!status) {
      return res.status(404).json({ message: 'Enrollment not found for this email' })
    }

    res.status(200).json({ status })
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Check enrollment status for ${req.body.email || 'unknown email'}`,
      'Failed to check enrollment status'
    )
  }
}

/**
 * Updates an enrollment.
 * @param {Object} req - The request object containing the enrollment ID in req.params and updated data in req.body.
 * @param {Object} res - The response object.
 */
const updateEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId
    const updatedData = req.body

    const enrollment = await enrollmentService.updateEnrollment(enrollmentId, updatedData)

    res.status(200).json(enrollment) // Return the updated data
    log.info(`Enrollment with ID: ${enrollmentId} updated successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Update enrollment ${req.params.enrollmentId}`,
      'Failed to update enrollment'
    )
  }
}

/**
 * Deletes an enrollment.
 * @param {Object} req - The request object containing the enrollment ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId

    await enrollmentService.deleteEnrollment(enrollmentId)

    res.status(200).json({ message: 'Enrollment deleted successfully' })
    log.info(`Enrollment with ID: ${enrollmentId} deleted successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete enrollment ${req.params.enrollmentId}`,
      'Failed to delete enrollment'
    )
  }
}

export {
  getAllEnrollments,
  createEnrollment,
  getEnrollmentById,
  approveEnrollment,
  rejectEnrollment,
  getEnrollmentsBySchool,
  checkEnrollmentStatus,
  updateEnrollment,
  deleteEnrollment,
}

import { afterEach, jest, describe, test, beforeEach, expect } from '@jest/globals'
import {
  createEnrollment,
  getEnrollmentById,
  approveEnrollment,
  rejectEnrollment,
  getAllEnrollments,
  getEnrollmentsBySchool,
  checkEnrollmentStatus,
  updateEnrollment,
  deleteEnrollment,
} from '../../../src/controllers/enrollmentController.js'
import EnrollmentService from '../../../src/services/enrollmentService.js'
import { log } from '../../../src/utils/logger.js'
import { validEnrollments } from '../../fixtures/enrollmentData.js'

describe('Enrollment Controller', () => {
  let mockReq
  let mockRes
  let createEnrollmentSpy
  let getEnrollmentByIdSpy
  let approveEnrollmentSpy
  let rejectEnrollmentSpy
  let getAllEnrollmentsSpy
  let getEnrollmentsBySchoolSpy
  let checkEnrollmentStatusSpy
  let updateEnrollmentSpy
  let deleteEnrollmentSpy

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {}, user: { id: 1 } } // Added user to mockReq for approve/reject
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn(), // Mock for .end() in deleteEnrollment
    }

    createEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'createEnrollment')
    getEnrollmentByIdSpy = jest.spyOn(EnrollmentService.prototype, 'getEnrollmentById')
    approveEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'approveEnrollment')
    rejectEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'rejectEnrollment')
    getAllEnrollmentsSpy = jest.spyOn(EnrollmentService.prototype, 'getAllEnrollments')
    getEnrollmentsBySchoolSpy = jest.spyOn(EnrollmentService.prototype, 'getEnrollmentsBySchool')
    checkEnrollmentStatusSpy = jest.spyOn(EnrollmentService.prototype, 'checkEnrollmentStatus')
    updateEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'updateEnrollment') // Spy setup for updateEnrollment
    deleteEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'deleteEnrollment') // Spy setup for deleteEnrollment

    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createEnrollment', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      mockReq = {
        body: {}, // Empty body to test missing fields
      }
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      }
      // Mock the logger
      jest.spyOn(log, 'info')
    })
    test('should create enrollment successfully', async () => {
      // Arrange
      const enrollmentData = validEnrollments[0]
      mockReq.body = enrollmentData
      const mockEnrollment = { id: 1, ...enrollmentData }
      createEnrollmentSpy.mockResolvedValue(mockEnrollment)

      // Act
      await createEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Enrollment created successfully',
        enrollment: mockEnrollment,
      })
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle missing required fields', async () => {
      // Arrange
      const expectedErrors = {
        first_name: 'First name is required.',
        last_name: 'Last name is required.',
        birth_date: 'Birth date is required.',
        school_id: 'School ID is required.',
        year_level: 'Year level is required.',
        password: 'Password is required.',
        contact_no: 'Contact number is required.',
        email: 'Email is required.',
        confirm_password: 'Passwords do not match.',
      }

      // Act
      await createEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ errors: expectedErrors })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle password mismatch', async () => {
      const enrollmentData = { ...validEnrollments[0], confirm_password: 'wrongpassword' }
      mockReq.body = enrollmentData

      await createEnrollment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { confirm_password: 'Passwords do not match.' },
      })
    })

    test('should handle weak password (no number and symbol)', async () => {
      const enrollmentData = {
        ...validEnrollments[0],
        password: 'password',
        confirm_password: 'password',
      }
      mockReq.body = enrollmentData

      await createEnrollment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { password: 'Password must contain at least one number and one symbol.' },
      })
    })

    test('should handle invalid contact number format', async () => {
      const invalidContactNoEnrollment = { ...validEnrollments[0], contact_no: '12345' }
      mockReq.body = invalidContactNoEnrollment
      await createEnrollment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: {
          contact_no: 'Invalid contact number format. Must start with 09 and have 11 digits.',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle middle initial too long', async () => {
      const longMiddleInitialEnrollment = { ...validEnrollments[0], middle_initial: 'ABCD' }
      mockReq.body = longMiddleInitialEnrollment

      await createEnrollment(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { middle_initial: 'Middle Initial is maximum of 2 characters only.' },
      })
    })

    test('should handle duplicate email error', async () => {
      // Arrange
      const enrollmentData = validEnrollments[0]
      mockReq.body = enrollmentData

      const error = new Error('Email already exists')
      error.name = 'SequelizeUniqueConstraintError' // Simulate Sequelize unique constraint error
      error.errors = [
        {
          message: 'Email already exists',
          path: 'email',
          value: enrollmentData.email,
          type: 'unique violation',
        },
      ]

      createEnrollmentSpy.mockRejectedValue(error)

      // Act
      await createEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          details: {
            email: 'Email already exists.',
          },
          message: 'Resource already exists',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle Sequelize validation errors', async () => {
      // Arrange
      mockReq.body = validEnrollments[0]
      const error = new Error('Validation error')
      error.name = 'SequelizeValidationError'
      error.errors = [{ message: 'Email is invalid', path: 'email' }] // Example Sequelize error
      createEnrollmentSpy.mockRejectedValue(error)

      // Act
      await createEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          details: {
            email: 'Email is invalid',
          },
          message: 'Validation failed',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during enrollment', async () => {
      // Arrange
      mockReq.body = validEnrollments[0]
      const error = new Error('Unexpected error')
      createEnrollmentSpy.mockRejectedValue(error)

      // Act
      await createEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentById', () => {
    test('should retrieve enrollment by ID successfully', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const mockEnrollment = { id: 1, ...validEnrollments[0] }
      getEnrollmentByIdSpy.mockResolvedValue(mockEnrollment)

      // Act
      await getEnrollmentById(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment)
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle enrollment not found', async () => {
      // Arrange
      mockReq.params.enrollmentId = '99'
      const error = new Error('Enrollment not found')
      getEnrollmentByIdSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentById(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during retrieval', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const error = new Error('Unexpected error')
      getEnrollmentByIdSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentById(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('approveEnrollment', () => {
    test('should approve enrollment successfully', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const mockEnrollment = { id: 1, status: 'approved' }
      approveEnrollmentSpy.mockResolvedValue(mockEnrollment)

      // Act
      await approveEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Enrollment approved successfully',
        status: mockEnrollment.status
      })
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was approved')
    })

    test('should handle enrollment not found', async () => {
      // Arrange
      mockReq.params.enrollmentId = '99'
      const error = new Error('Enrollment not found')
      approveEnrollmentSpy.mockRejectedValue(error)

      // Act
      await approveEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during approval', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const error = new TypeError('Unexpected error')
      approveEnrollmentSpy.mockRejectedValue(error)

      // Act
      await approveEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to approve enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('rejectEnrollment', () => {
    test('should reject enrollment successfully', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const mockEnrollment = { id: 1, status: 'rejected' }
      rejectEnrollmentSpy.mockResolvedValue(mockEnrollment)

      // Act
      await rejectEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment)
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was rejected')
    })

    test('should handle enrollment not found during rejection', async () => {
      // Arrange
      mockReq.params.enrollmentId = '99'
      const error = new Error('Enrollment not found')
      rejectEnrollmentSpy.mockRejectedValue(error)

      // Act
      await rejectEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during rejection', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const error = new TypeError('Unexpected error')
      rejectEnrollmentSpy.mockRejectedValue(error)

      // Act
      await rejectEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to reject enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAllEnrollments', () => {
    test('should retrieve all enrollments successfully', async () => {
      // Arrange
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }))
      getAllEnrollmentsSpy.mockResolvedValue(mockEnrollments)

      // Act
      await getAllEnrollments(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments)
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during retrieving all enrollments', async () => {
      // Arrange
      const error = new Error('Unexpected error')
      getAllEnrollmentsSpy.mockRejectedValue(error)

      // Act
      await getAllEnrollments(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve enrollments',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentsBySchool', () => {
    test('should retrieve enrollments by school ID successfully', async () => {
      // Arrange
      const schoolId = '1'
      mockReq.params.schoolId = schoolId
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }))
      getEnrollmentsBySchoolSpy.mockResolvedValue(mockEnrollments)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments)
      expect(log.info).toHaveBeenCalledWith(`Retrieved enrollments for school ID: ${schoolId}`)
      expect(getEnrollmentsBySchoolSpy).toHaveBeenCalledWith(schoolId)
    })

    test('should handle school not found', async () => {
      // Arrange
      const schoolId = '99'
      mockReq.params.schoolId = schoolId
      const error = new Error('School not found')
      getEnrollmentsBySchoolSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'School not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle errors when retrieving enrollments by school', async () => {
      // Arrange
      const schoolId = '1'
      mockReq.params.schoolId = schoolId
      const error = new Error('Unexpected error')
      getEnrollmentsBySchoolSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve enrollments by schools',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('checkEnrollmentStatus', () => {
    test('should check enrollment status by email successfully', async () => {
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      const mockEnrollment = 'approved'
      checkEnrollmentStatusSpy.mockResolvedValue(mockEnrollment)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ status: mockEnrollment })
      expect(checkEnrollmentStatusSpy).toHaveBeenCalledWith(email)
    })

    test('should handle enrollment not found', async () => {
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      checkEnrollmentStatusSpy.mockResolvedValue(null)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found for this email' })
    })

    test('should handle errors when checking enrollment status', async () => {
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      const error = new Error('Unexpected error')
      checkEnrollmentStatusSpy.mockRejectedValue(error)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check enrollment status',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Check enrollment status for test@example.com error:',
        error
      )
    })

    test('should handle missing email', async () => {
      // Arrange
      // No email in mockReq.body
      // Act
      await checkEnrollmentStatus(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email is required' })
    })
  })

  describe('updateEnrollment', () => {
    // New describe block for updateEnrollment
    test('should update enrollment successfully', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const updatedData = { first_name: 'UpdatedFirstName' }
      mockReq.body = updatedData
      const mockUpdatedEnrollment = { id: '1', ...validEnrollments[0], ...updatedData }
      updateEnrollmentSpy.mockResolvedValue(mockUpdatedEnrollment)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedEnrollment)
      expect(updateEnrollmentSpy).toHaveBeenCalledWith('1', updatedData)
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle enrollment not found during update', async () => {
      // Arrange
      mockReq.params.enrollmentId = '99'
      mockReq.body = { first_name: 'UpdatedFirstName' }
      const error = new Error('Enrollment not found')
      updateEnrollmentSpy.mockRejectedValue(error)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle Sequelize validation errors during update', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      mockReq.body = { email: 'invalid-email' } // Simulate invalid email
      const error = new Error('Validation error')
      error.name = 'SequelizeValidationError'
      error.errors = [{ message: 'Invalid email format', path: 'email' }]
      updateEnrollmentSpy.mockRejectedValue(error)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          details: {
            email: 'Invalid email format',
          },
          message: 'Validation failed',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle duplicate email error during update', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      mockReq.body = { email: 'duplicate@example.com' }
      const error = new Error('Email already exists')
      error.name = 'SequelizeUniqueConstraintError'
      error.errors = [{ path: 'email', message: 'Email already exists' }]
      updateEnrollmentSpy.mockRejectedValue(error)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409) // Expect 409 Conflict
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'CONFLICT',
          details: {
            email: 'Email already exists.',
          },
          message: 'Resource already exists',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during update', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      mockReq.body = { first_name: 'UpdatedFirstName' }
      const error = new Error('Unexpected error')
      updateEnrollmentSpy.mockRejectedValue(error)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('deleteEnrollment', () => {
    // New describe block for deleteEnrollment
    test('should delete enrollment successfully', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      deleteEnrollmentSpy.mockResolvedValue(1) // Mock successful deletion

      // Act
      await deleteEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment deleted successfully' })
      expect(deleteEnrollmentSpy).toHaveBeenCalledWith('1')
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle enrollment not found during delete', async () => {
      // Arrange
      mockReq.params.enrollmentId = '99'
      const error = new Error('Enrollment not found')
      deleteEnrollmentSpy.mockRejectedValue(error)

      // Act
      await deleteEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Enrollment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during delete', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      const error = new Error('Unexpected error')
      deleteEnrollmentSpy.mockRejectedValue(error)

      // Act
      await deleteEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete enrollment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })
})

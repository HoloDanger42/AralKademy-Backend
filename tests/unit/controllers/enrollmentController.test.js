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
      await createEnrollment(mockReq, mockRes) // Updated function call

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
        errors: { middle_initial: 'Middle Initial is maximum of 3 characters only.' },
      })
    })

    test('should handle duplicate email error', async () => {
      // Updated test name
      // Arrange
      const enrollmentData = validEnrollments[0]
      mockReq.body = enrollmentData
      const error = new Error('Email already exists')
      error.name = 'SequelizeUniqueConstraintError' // Simulate Sequelize unique constraint error
      createEnrollmentSpy.mockRejectedValue(error)

      // Act
      await createEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409) // Updated status code to 409
      expect(mockRes.json).toHaveBeenCalledWith({ errors: { email: 'Email already exists.' } }) // Updated message format
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
      expect(mockRes.json).toHaveBeenCalledWith({ errors: { email: 'Email is invalid' } })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during enrollment', async () => {
      // Updated test name
      // Arrange
      mockReq.body = validEnrollments[0]
      const error = new Error('Unexpected error')
      createEnrollmentSpy.mockRejectedValue(error)

      // Act
      await createEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to create enrollment' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentById', () => {
    // Updated describe name
    test('should retrieve enrollment by ID successfully', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const mockEnrollment = { id: 1, ...validEnrollments[0] }
      getEnrollmentByIdSpy.mockResolvedValue(mockEnrollment)

      // Act
      await getEnrollmentById(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment)
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle enrollment not found', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '99' // Updated param name
      const error = new Error('Enrollment not found')
      getEnrollmentByIdSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentById(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during retrieval', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const error = new Error('Unexpected error')
      getEnrollmentByIdSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentById(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve enrollment' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('approveEnrollment', () => {
    // Updated describe name
    test('should approve enrollment successfully', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const mockEnrollment = { id: 1, status: 'approved' }
      approveEnrollmentSpy.mockResolvedValue(mockEnrollment)

      // Act
      await approveEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment)
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was approved')
    })

    test('should handle enrollment not found', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '99' // Updated param name
      const error = new Error('Enrollment not found')
      approveEnrollmentSpy.mockRejectedValue(error)

      // Act
      await approveEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during approval', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const error = new TypeError('Unexpected error')
      approveEnrollmentSpy.mockRejectedValue(error)

      // Act
      await approveEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to approve enrollment' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('rejectEnrollment', () => {
    // Updated describe name
    test('should reject enrollment successfully', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const mockEnrollment = { id: 1, status: 'rejected' }
      rejectEnrollmentSpy.mockResolvedValue(mockEnrollment)

      // Act
      await rejectEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment)
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was rejected')
    })

    test('should handle enrollment not found during rejection', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '99' // Updated param name
      const error = new Error('Enrollment not found')
      rejectEnrollmentSpy.mockRejectedValue(error)

      // Act
      await rejectEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during rejection', async () => {
      // Updated test name
      // Arrange
      mockReq.params.enrollmentId = '1' // Updated param name
      const error = new TypeError('Unexpected error')
      rejectEnrollmentSpy.mockRejectedValue(error)

      // Act
      await rejectEnrollment(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to reject enrollment' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAllEnrollments', () => {
    // Updated describe name
    test('should retrieve all enrollments successfully', async () => {
      // Updated test name
      // Arrange
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }))
      getAllEnrollmentsSpy.mockResolvedValue(mockEnrollments)

      // Act
      await getAllEnrollments(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments)
      expect(log.info).toHaveBeenCalled()
    })

    test('should handle unexpected server errors during retrieving all enrollments', async () => {
      // Updated test name
      // Arrange
      const error = new Error('Unexpected error')
      getAllEnrollmentsSpy.mockRejectedValue(error)

      // Act
      await getAllEnrollments(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve enrollments' })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentsBySchool', () => {
    // Updated describe name
    test('should retrieve enrollments by school ID successfully', async () => {
      // Updated test name
      // Arrange
      const schoolId = '1'
      mockReq.params.schoolId = schoolId
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }))
      getEnrollmentsBySchoolSpy.mockResolvedValue(mockEnrollments)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments)
      expect(log.info).toHaveBeenCalledWith(`Retrieved enrollments for school ID: ${schoolId}`)
      expect(getEnrollmentsBySchoolSpy).toHaveBeenCalledWith(schoolId)
    })

    test('should handle school not found', async () => {
      // Updated test name
      // Arrange
      const schoolId = '99'
      mockReq.params.schoolId = schoolId
      const error = new Error('School not found')
      getEnrollmentsBySchoolSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'School not found' })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle errors when retrieving enrollments by school', async () => {
      // Updated test name
      // Arrange
      const schoolId = '1'
      mockReq.params.schoolId = schoolId
      const error = new Error('Unexpected error')
      getEnrollmentsBySchoolSpy.mockRejectedValue(error)

      // Act
      await getEnrollmentsBySchool(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to retrieve enrollments by school',
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('checkEnrollmentStatus', () => {
    // Updated describe name
    test('should check enrollment status by email successfully', async () => {
      // Updated test name
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      const mockEnrollment = 'approved'
      checkEnrollmentStatusSpy.mockResolvedValue(mockEnrollment)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({ status: mockEnrollment })
      expect(checkEnrollmentStatusSpy).toHaveBeenCalledWith(email)
    })

    test('should handle enrollment not found', async () => {
      // Updated test name
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      checkEnrollmentStatusSpy.mockResolvedValue(null)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found for this email' })
    })

    test('should handle errors when checking enrollment status', async () => {
      // Updated test name
      // Arrange
      const email = 'test@example.com'
      mockReq.body.email = email
      const error = new Error('Unexpected error')
      checkEnrollmentStatusSpy.mockRejectedValue(error)

      // Act
      await checkEnrollmentStatus(mockReq, mockRes) // Updated function call

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to check enrollment status' })
      expect(log.error).toHaveBeenCalledWith('Error checking enrollment status:', error)
    })

    test('should handle missing email', async () => {
      // Updated test name
      // Arrange
      // No email in mockReq.body
      // Act
      await checkEnrollmentStatus(mockReq, mockRes) // Updated function call

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
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' })
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
      expect(mockRes.json).toHaveBeenCalledWith({ errors: { email: 'Invalid email format' } })
      expect(log.error).toHaveBeenCalled()
    })

    test('should handle duplicate email error during update', async () => {
      // Arrange
      mockReq.params.enrollmentId = '1'
      mockReq.body = { email: 'duplicate@example.com' }
      const error = new Error('Email already exists')
      error.name = 'SequelizeUniqueConstraintError' // Correct error name
      updateEnrollmentSpy.mockRejectedValue(error)

      // Act
      await updateEnrollment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409) // Expect 409 Conflict
      expect(mockRes.json).toHaveBeenCalledWith({ errors: { email: 'Email already exists.' } })
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
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' }) // Generic message from controller
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
      expect(mockRes.status).toHaveBeenCalledWith(204)
      expect(mockRes.end).toHaveBeenCalled() // Check for .end() for 204 No Content
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
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' })
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
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' }) // Generic message from controller
      expect(log.error).toHaveBeenCalled()
    })
  })
})

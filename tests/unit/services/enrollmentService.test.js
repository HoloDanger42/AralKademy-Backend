import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import EnrollmentService from '../../../src/services/enrollmentService'
import { validEnrollments, invalidEnrollments } from '../../fixtures/enrollmentData'
import bcrypt from 'bcryptjs'

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword')

const mockEnrollmentModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
}

const mockSchoolModel = {
  findByPk: jest.fn(),
}

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
}

const mockLearnerModel = {
  findOne: jest.fn(),
  create: jest.fn(),
}

describe('Enrollment Service', () => {
  let enrollmentService

  beforeEach(() => {
    enrollmentService = new EnrollmentService(
      mockEnrollmentModel,
      mockSchoolModel,
      mockUserModel,
      mockLearnerModel
    )
    jest.resetAllMocks()
  })

  describe('enroll', () => {
    test('should enroll a new user successfully (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0]
      const hashedPassword = 'hashed_password'
      bcrypt.hash.mockResolvedValue(hashedPassword)

      const expectedEnrollmentData = {
        email: validEnrollment.email,
        password: validEnrollment.password,
        first_name: validEnrollment.first_name,
        last_name: validEnrollment.last_name,
        birth_date: validEnrollment.birth_date,
        contact_no: validEnrollment.contact_no,
        school_id: validEnrollment.school_id,
        year_level: validEnrollment.year_level,
        status: 'pending',
      }

      mockEnrollmentModel.create.mockResolvedValue({
        id: 1,
        ...expectedEnrollmentData,
        password: hashedPassword,
      })

      // Act
      const enrollment = await enrollmentService.createEnrollment(expectedEnrollmentData)

      // Assert
      expect(enrollment).toBeDefined()
      expect(bcrypt.hash).toHaveBeenCalledWith(validEnrollment.password, 12) // Note: Changed to 12 to match implementation
      expect(mockEnrollmentModel.create).toHaveBeenCalledWith({
        ...expectedEnrollmentData,
        password: hashedPassword,
        handled_by_id: null,
      })
    })

    test('should throw an error if email already exists (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0]
      const enrollmentData = {
        email: validEnrollment.email,
        password: validEnrollment.password,
        first_name: validEnrollment.first_name,
        last_name: validEnrollment.last_name,
        birth_date: validEnrollment.birth_date,
        contact_no: validEnrollment.contact_no,
        school_id: validEnrollment.school_id,
        year_level: validEnrollment.year_level,
      }
      const sequelizeError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email' }],
      }
      bcrypt.hash.mockResolvedValue('hashed_password')
      mockEnrollmentModel.create.mockRejectedValue(sequelizeError)

      //// Act & Assert
      await expect(enrollmentService.createEnrollment(enrollmentData)).rejects.toThrow(
        'Email already exists'
      )
    })

    test('should throw an error if enrollment fails (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0]
      bcrypt.hash.mockResolvedValue('hashed_password')
      mockEnrollmentModel.create.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(
        enrollmentService.createEnrollment(
          validEnrollment.email,
          validEnrollment.password,
          validEnrollment.first_name,
          validEnrollment.last_name,
          validEnrollment.birth_date,
          validEnrollment.contact_no,
          validEnrollment.school_id,
          validEnrollment.year_level
        )
      ).rejects.toThrow('Failed to create enrollment')
    })
  })

  describe('approveEnrollment', () => {
    test('should approve an enrollment successfully (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 2
      const enrollment = {
        id: enrollmentId,
        email: 'john@example.com',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }
      const user = {
        id: 101,
        email: 'john@example.com',
      }
      const learner = {
        user_id: user.id,
        enrollment_id: enrollmentId,
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)
      mockUserModel.findOne.mockResolvedValue(user) // Changed: Return existing user
      mockLearnerModel.findOne.mockResolvedValue(null)
      mockLearnerModel.create.mockResolvedValue(learner)

      // Act
      const result = await enrollmentService.approveEnrollment(enrollmentId, adminId)

      // Assert
      expect(result).toMatchObject({
        id: enrollmentId,
        status: 'approved',
        handled_by_id: adminId,
      })

      expect(enrollment.save).toHaveBeenCalled()
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: enrollment.email },
      })
    })

    test('should throw an error if enrollment is not found (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99
      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
    })

    test('should throw an error if updating enrollment fails (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99
      const enrollment = {
        id: enrollmentId,
        enrollment_id: enrollmentId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'hashedpassword',
        birth_date: '2000-01-01',
        contact_no: '123456789',
        school_id: 5,
        year_level: '3rd Year',
        status: 'pending',
        save: jest.fn().mockRejectedValue(new Error('Failed to approve enrollment')),
      }

      const user = { user_id: 101, email: 'john@example.com' }
      const learner = { user_id: 101, enrollment_id: enrollmentId }

      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)
      mockUserModel.findOne.mockResolvedValue(user)
      mockLearnerModel.findOne.mockResolvedValue(learner)

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Failed to approve enrollment'
      )

      console.log('Enrollment save method should be called before this')

      expect(enrollment.save).toHaveBeenCalled()
    })
  })

  describe('rejectEnrollment', () => {
    test('should reject an enrollment successfully (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn() }
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)

      // Act
      const result = await enrollmentService.rejectEnrollment(enrollmentId, adminId)

      // Assert
      expect(result).toEqual({
        id: enrollmentId,
        status: 'rejected',
        handled_by_id: adminId,
        save: expect.any(Function),
      })
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
      expect(enrollment.save).toHaveBeenCalled()
      expect(enrollment.status).toBe('rejected')
      expect(enrollment.handled_by_id).toBe(adminId)
    })

    test('should throw an error if enrollment is not found (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99
      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.rejectEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
    })

    test('should throw an error if updating enrollment fails (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99
      const enrollment = {
        id: enrollmentId,
        status: 'pending',
        save: jest.fn().mockRejectedValue(new Error('Failed to reject enrollment')),
      }
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)

      // Act & Assert
      await expect(enrollmentService.rejectEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Failed to reject enrollment'
      )
      expect(enrollment.save).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentById', () => {
    test('should retrieve an enrollment by ID successfully (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1
      const expectedEnrollment = { id: enrollmentId, ...validEnrollments[0] }
      mockEnrollmentModel.findByPk.mockResolvedValue(expectedEnrollment)

      // Act
      const enrollment = await enrollmentService.getEnrollmentById(enrollmentId)

      // Assert
      expect(enrollment).toEqual(expectedEnrollment)
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, {
        attributes: { exclude: ['password'] },
        include: [{ model: mockSchoolModel, as: 'school' }],
      })
    })

    test('should throw an error when the enrollment does not exist (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1
      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, {
        attributes: { exclude: ['password'] },
        include: [{ model: mockSchoolModel, as: 'school' }],
      })
    })

    test('should throw an error when fetching of enrollment fails (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1
      mockEnrollmentModel.findByPk.mockRejectedValue(new Error('Failed to fetch enrollment'))

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow(
        'Failed to fetch enrollment'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, {
        attributes: { exclude: ['password'] },
        include: [{ model: mockSchoolModel, as: 'school' }],
      })
    })
  })

  describe('getAllEnrollments', () => {
    test('should retrieve all enrollments successfully (get all enrollments)', async () => {
      // Arrange
      const expectedEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }))
      mockEnrollmentModel.findAll.mockResolvedValue(expectedEnrollments)

      // Act
      const enrollments = await enrollmentService.getAllEnrollments()

      // Assert
      expect(enrollments).toEqual(expectedEnrollments)
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled()
    })

    test('should throw an error when fetching enrollments fails (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(enrollmentService.getAllEnrollments()).rejects.toThrow(
        'Failed to fetch enrollments'
      )
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled()
    })

    test('should return an empty list if no enrollments exist (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockResolvedValue([])

      // Act
      const enrollments = await enrollmentService.getAllEnrollments()

      // Assert
      expect(enrollments).toEqual([])
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled()
    })
  })

  describe('getEnrollmentsBySchool', () => {
    test('should retrieve enrollments by school successfully (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1
      const expectedEnrollments = [{ id: 1, school_id: schoolId, status: 'pending' }]
      mockSchoolModel.findByPk.mockResolvedValue({ id: schoolId })
      mockEnrollmentModel.findAll.mockResolvedValue(expectedEnrollments)

      // Act
      const enrollments = await enrollmentService.getEnrollmentsBySchool(schoolId)

      // Assert
      expect(enrollments).toEqual(expectedEnrollments)
      expect(mockEnrollmentModel.findAll).toHaveBeenCalledWith({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
        include: [{ model: mockSchoolModel, as: 'school' }],
      })
    })

    test('should throw an error if the school does not exist (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1
      mockSchoolModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.getEnrollmentsBySchool(schoolId)).rejects.toThrow(
        'School not found'
      )
    })

    test('should throw an error if fetching enrollments by school fails (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1
      mockSchoolModel.findByPk.mockResolvedValue({ id: schoolId })
      mockEnrollmentModel.findAll.mockRejectedValue(
        new Error('Failed to fetch enrollments by school')
      )

      // Act & Assert
      await expect(enrollmentService.getEnrollmentsBySchool(schoolId)).rejects.toThrow(
        'Failed to fetch enrollments by school'
      )
    })
  })

  describe('checkEnrollmentStatus', () => {
    test('should retrieve the enrollment status by email successfully (check enrollment status)', async () => {
      // Arrange
      const email = 'test@example.com'
      const expectedStatus = 'pending'
      mockEnrollmentModel.findOne.mockResolvedValue({ status: expectedStatus })

      // Act
      const status = await enrollmentService.checkEnrollmentStatus(email)

      // Assert
      expect(status).toEqual(expectedStatus)
      expect(mockEnrollmentModel.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: ['status'],
      })
    })

    test('should return null if the enrollment does not exist (check enrollment status)', async () => {
      // Arrange
      const email = 'test@example.com'
      mockEnrollmentModel.findOne.mockResolvedValue(null)

      // Act
      const status = await enrollmentService.checkEnrollmentStatus(email)

      // Assert
      expect(status).toBeNull()
      expect(mockEnrollmentModel.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: ['status'],
      })
    })

    test('should throw an error if fetching the enrollment status fails (check enrollment status)', async () => {
      // Arrange
      const email = 'test@example.com'
      mockEnrollmentModel.findOne.mockRejectedValue(new Error('Failed to fetch enrollment status'))

      // Act & Assert
      await expect(enrollmentService.checkEnrollmentStatus(email)).rejects.toThrow(
        'Failed to fetch enrollment status'
      )
      expect(mockEnrollmentModel.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: ['status'],
      })
    })
  })

  describe('updateEnrollment', () => {
    test('should update enrollment data successfully', async () => {
      // Arrange
      const enrollmentId = 1
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        contact_no: '9876543210',
        // Adding password fields that should be removed
        password: 'newpassword',
        confirm_password: 'newpassword',
      }

      const existingEnrollment = {
        enrollment_id: enrollmentId,
        first_name: 'Original',
        last_name: 'User',
        update: jest.fn().mockImplementation((data) => {
          return Promise.resolve({
            enrollment_id: enrollmentId,
            ...data,
          })
        }),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(existingEnrollment)

      // Act
      const result = await enrollmentService.updateEnrollment(enrollmentId, updateData)

      // Assert
      expect(result).toEqual({
        enrollment_id: enrollmentId,
        first_name: 'Updated',
        last_name: 'Name',
        contact_no: '9876543210',
      })

      // Verify password fields were removed before update
      expect(existingEnrollment.update).toHaveBeenCalledWith({
        first_name: 'Updated',
        last_name: 'Name',
        contact_no: '9876543210',
      })
      expect(existingEnrollment.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'newpassword',
          confirm_password: 'newpassword',
        })
      )
    })

    test('should throw an error if enrollment is not found', async () => {
      // Arrange
      const enrollmentId = 999
      const updateData = { first_name: 'Updated' }
      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.updateEnrollment(enrollmentId, updateData)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
    })

    test('should handle validation errors correctly', async () => {
      // Arrange
      const enrollmentId = 1
      const updateData = { email: 'invalid-email' }
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [{ message: 'Invalid email format' }],
      }

      const mockEnrollment = {
        enrollment_id: enrollmentId,
        update: jest.fn().mockRejectedValue(validationError),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment)

      // Act & Assert
      await expect(enrollmentService.updateEnrollment(enrollmentId, updateData)).rejects.toEqual(
        validationError
      )
      expect(mockEnrollment.update).toHaveBeenCalledWith(updateData)
    })

    test('should handle unique constraint violations (email already exists)', async () => {
      // Arrange
      const enrollmentId = 1
      const updateData = { email: 'existing@example.com' }
      const uniqueConstraintError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email' }],
      }

      const mockEnrollment = {
        enrollment_id: enrollmentId,
        update: jest.fn().mockRejectedValue(uniqueConstraintError),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment)

      // Act & Assert
      await expect(enrollmentService.updateEnrollment(enrollmentId, updateData)).rejects.toThrow(
        'Email already exists'
      )
      expect(mockEnrollment.update).toHaveBeenCalledWith(updateData)
    })

    test('should re-throw other errors during update', async () => {
      // Arrange
      const enrollmentId = 1
      const updateData = { first_name: 'Updated' }
      const mockError = new Error('Database connection failed')

      const mockEnrollment = {
        enrollment_id: enrollmentId,
        update: jest.fn().mockRejectedValue(mockError),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment)

      // Act & Assert
      await expect(enrollmentService.updateEnrollment(enrollmentId, updateData)).rejects.toEqual(
        mockError
      )
      expect(mockEnrollment.update).toHaveBeenCalledWith(updateData)
    })
  })

  describe('deleteEnrollment', () => {
    test('should delete enrollment successfully', async () => {
      // Arrange
      const enrollmentId = 1
      const mockEnrollment = {
        enrollment_id: enrollmentId,
        destroy: jest.fn().mockResolvedValue(true),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment)

      // Act
      await enrollmentService.deleteEnrollment(enrollmentId)

      // Assert
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
      expect(mockEnrollment.destroy).toHaveBeenCalled()
    })

    test('should throw an error if enrollment is not found', async () => {
      // Arrange
      const enrollmentId = 999
      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.deleteEnrollment(enrollmentId)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
    })

    test('should re-throw errors during deletion', async () => {
      // Arrange
      const enrollmentId = 1
      const mockError = new Error('Database error during deletion')

      const mockEnrollment = {
        enrollment_id: enrollmentId,
        destroy: jest.fn().mockRejectedValue(mockError),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment)

      // Act & Assert
      await expect(enrollmentService.deleteEnrollment(enrollmentId)).rejects.toEqual(mockError)
      expect(mockEnrollment.destroy).toHaveBeenCalled()
    })
  })
})

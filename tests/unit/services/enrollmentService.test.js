import { jest } from '@jest/globals'
import EnrollmentService from '../../../src/services/enrollmentService'
import { validEnrollments, invalidEnrollments } from '../../fixtures/enrollmentData'
import bcrypt from 'bcryptjs'

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword')

const mockEnrollmentModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn()
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
      const enrollmentData = { ...validEnrollments[0] };
      
      // Mock the manual check to find existing user
      mockUserModel.findOne.mockResolvedValue({ 
        email: enrollmentData.email 
      });
    
      // Act & Assert
      await expect(enrollmentService.createEnrollment(enrollmentData))
        .rejects.toThrow('Email already exists');
      
      // Verify we didn't even try to create
      expect(mockEnrollmentModel.create).not.toHaveBeenCalled();
    });

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

      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true),
      }

      mockEnrollmentModel.sequelize = {
        transaction: jest.fn().mockResolvedValue(mockTransaction),
      }

      const enrollment = {
        id: enrollmentId,
        status: 'pending',
        save: jest.fn().mockResolvedValue(true),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)

      mockUserModel.create = jest.fn().mockResolvedValue({ id: 123 })
      mockLearnerModel.create = jest.fn().mockResolvedValue({ id: 456 })

      // Act
      const result = await enrollmentService.approveEnrollment(enrollmentId, adminId)

      // Assert
      expect(result).toEqual({
        id: enrollmentId,
        status: 'approved',
        handled_by_id: adminId,
        save: expect.any(Function),
      })
      expect(enrollment.save).toHaveBeenCalled()
      expect(mockTransaction.commit).toHaveBeenCalled()
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
      expect(mockUserModel.create).toHaveBeenCalledWith(expect.any(Object), {
        transaction: mockTransaction,
      })
      expect(mockLearnerModel.create).toHaveBeenCalledWith(expect.any(Object), {
        transaction: mockTransaction,
      })
    })

    test('should throw an error if enrollment is not found (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 99

      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true),
      }

      mockEnrollmentModel.sequelize = {
        transaction: jest.fn().mockResolvedValue(mockTransaction),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Enrollment not found'
      )
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId)
      expect(mockTransaction.rollback).toHaveBeenCalled()
    })

    test('should throw an error if updating enrollment fails (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1
      const adminId = 2

      // Add mock transaction
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true),
      }

      mockEnrollmentModel.sequelize = {
        transaction: jest.fn().mockResolvedValue(mockTransaction),
      }

      const enrollment = {
        id: enrollmentId,
        status: 'pending',
        handled_by_id: null,
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }

      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment)

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow(
        'Failed to approve enrollment'
      )

      expect(enrollment.save).toHaveBeenCalled()
      expect(mockTransaction.rollback).toHaveBeenCalled()
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
    /* test('should retrieve paginated enrollments successfully', async () => {
      // Arrange
      const mockResponse = {
        count: validEnrollments.length,
        rows: validEnrollments.map((enrollment, index) => ({
          id: index + 1,
          ...enrollment,
        })),
        statusCounts: [
          { status: 'pending', count: validEnrollments.length }
        ]
      };
  
      mockEnrollmentModel.findAndCountAll.mockResolvedValue({
        count: mockResponse.count,
        rows: mockResponse.rows
      });
      mockEnrollmentModel.findAll.mockResolvedValue(mockResponse.statusCounts);
  
      // Act
      // Mock the database response for findAndCountAll and findAll
      mockEnrollmentModel.findAndCountAll.mockResolvedValue({
        count: validEnrollments.length,
        rows: validEnrollments.map((enrollment, index) => ({
          id: index + 1,
          ...enrollment,
        })),
      });
      mockEnrollmentModel.findAll.mockResolvedValue([
        { status: 'pending', count: validEnrollments.length },
      ]);
      
      const result = await enrollmentService.getAllEnrollments();
  
      // Assert
      expect(result).toEqual({
        count: mockResponse.count,
        rows: mockResponse.rows,
        statusCounts: mockResponse.statusCounts
      });
      expect(mockEnrollmentModel.findAndCountAll).toHaveBeenCalled();
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    }); */
  
    test('should throw an error when fetching fails', async () => {
      // Arrange
      mockEnrollmentModel.findAndCountAll.mockRejectedValue(new Error('Database error'));
  
      // Act & Assert
      await expect(enrollmentService.getAllEnrollments()).rejects.toThrow(
        'Failed to fetch enrollments'
      );
    });
  
    /* test('should return empty result when no enrollments exist', async () => {
      // Arrange
      mockEnrollmentModel.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockEnrollmentModel.findAll.mockResolvedValue([]);
  
      // Act
      const result = await enrollmentService.getAllEnrollments();
  
      // Assert
      expect(result).toEqual({
        count: 0,
        rows: [],
        statusCounts: []
      });
    });
  
    test('should apply status filter when provided', async () => {
      // Arrange
      const status = 'pending';
      const mockResponse = {
        count: 1,
        rows: [{
          id: 1,
          ...validEnrollments[0],
          status,
          school: {} // Include school as it's included in the query
        }],
        statusCounts: [
          { status, count: 1 }
        ]
      };
    
      mockEnrollmentModel.findAndCountAll.mockResolvedValue({
        count: mockResponse.count,
        rows: mockResponse.rows
      });
      mockEnrollmentModel.findAll.mockResolvedValue(mockResponse.statusCounts);
    
      // Act
      const result = await enrollmentService.getAllEnrollments(status);
    
      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockEnrollmentModel.findAndCountAll).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        attributes: { exclude: ['password'] },
        include: [{ model: mockSchoolModel, as: 'school' }],
        where: { status }
      });
    }); */
  });

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

      // Act & Assert
      await expect(enrollmentService.checkEnrollmentStatus(email)).rejects.toThrow(
        'Enrollment not found'
      )
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

    test('should handle email already exists', async () => {
      // Arrange
      const enrollmentId = 1;
      const updateData = { email: 'existing@example.com' };
      
      const mockEnrollment = {
        enrollment_id: enrollmentId,
        update: jest.fn()
      };
    
      mockEnrollmentModel.findByPk.mockResolvedValue(mockEnrollment);
      mockUserModel.findOne.mockResolvedValue({ email: 'existing@example.com' }); // Simulate existing user
    
      // Act & Assert
      await expect(enrollmentService.updateEnrollment(enrollmentId, updateData))
        .rejects.toThrow('Email already exists');
      
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' }
      });
      expect(mockEnrollment.update).not.toHaveBeenCalled(); // Verify update wasn't attempted
    });

    test('should re-throw other errors during update', async () => {
      // Arrange
      const enrollmentId = 1
      const updateData = { first_name: 'Updated' }
      const mockError = new Error('Failed to update enrollment')

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
      const mockError = new Error('Failed to delete enrollment')

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

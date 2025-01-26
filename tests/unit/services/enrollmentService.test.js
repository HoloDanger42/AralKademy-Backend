import { beforeEach, describe, expect, jest } from '@jest/globals';
import EnrollmentService from '../../../src/services/enrollmentService';
import { validEnrollments, invalidEnrollments } from '../../fixtures/enrollmentData';
import bcrypt from 'bcryptjs';

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

const mockEnrollmentModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

describe('Enrollment Service', () => {
  let enrollmentService;

  beforeEach(() => {
    enrollmentService = new EnrollmentService(mockEnrollmentModel);
    jest.resetAllMocks();
  });

  describe('enroll', () => {
    test('should enroll a new user successfully (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0];
      const hashedPassword = 'hashed_password';
      bcrypt.hash.mockResolvedValue(hashedPassword);
      mockEnrollmentModel.create.mockResolvedValue({ id: 1, ...validEnrollment, password: hashedPassword });

      // Act
      const enrollment = await enrollmentService.enroll(
        validEnrollment.email,
        validEnrollment.password,
        validEnrollment.firstName,
        validEnrollment.lastName,
        validEnrollment.birthDate,
        validEnrollment.contactNo,
        validEnrollment.schoolId,
        validEnrollment.yearLevel
      );

      // Assert
      expect(enrollment).toEqual({ id: 1, ...validEnrollment, password: hashedPassword });
      expect(bcrypt.hash).toHaveBeenCalledWith(validEnrollment.password, 10);
      expect(mockEnrollmentModel.create).toHaveBeenCalledWith({
        email: validEnrollment.email,
        password: hashedPassword,
        first_name: validEnrollment.firstName,
        last_name: validEnrollment.lastName,
        birth_date: validEnrollment.birthDate,
        contact_no: validEnrollment.contactNo,
        school_id: validEnrollment.schoolId,
        year_level: validEnrollment.yearLevel,
        handled_by_id: null,
        status: 'pending',
      });
    });

    test('should throw an error if required fields are missing (enroll)', async () => {
      // Arrange
      const invalidEnrollment = invalidEnrollments[0];

      // Act & Assert
      await expect(
        enrollmentService.enroll(
          null,
          invalidEnrollment.password,
          invalidEnrollment.firstName,
          invalidEnrollment.lastName,
          invalidEnrollment.birthDate,
          invalidEnrollment.contactNo,
          invalidEnrollment.schoolId,
          invalidEnrollment.yearLevel
        )
      ).rejects.toThrow('All fields are required');
    });

    test('should throw an error if email already exists (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0];
      const sequelizeError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ path: 'email' }],
      };
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockEnrollmentModel.create.mockRejectedValue(sequelizeError);

      // Act & Assert
      await expect(
        enrollmentService.enroll(
          validEnrollment.email,
          validEnrollment.password,
          validEnrollment.firstName,
          validEnrollment.lastName,
          validEnrollment.birthDate,
          validEnrollment.contactNo,
          validEnrollment.schoolId,
          validEnrollment.yearLevel
        )
      ).rejects.toThrow('Email already exists');
    });

    test('should throw an error for other Sequelize errors (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0];
      const genericError = new Error('Database error');
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockEnrollmentModel.create.mockRejectedValue(genericError);

      // Act & Assert
      await expect(
        enrollmentService.enroll(
          validEnrollment.email,
          validEnrollment.password,
          validEnrollment.firstName,
          validEnrollment.lastName,
          validEnrollment.birthDate,
          validEnrollment.contactNo,
          validEnrollment.schoolId,
          validEnrollment.yearLevel
        )
      ).rejects.toThrow(genericError);
    });
  });

  describe('approveEnrollment', () => {
    test('should approve an enrollment successfully (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn() };
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment);

      // Act
      const result = await enrollmentService.approveEnrollment(enrollmentId, adminId);

      // Assert
      expect(result).toEqual({ id: enrollmentId, status: 'approved', handled_by_id: adminId, save: expect.any(Function) });
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
      expect(enrollment.save).toHaveBeenCalled();
      expect(enrollment.status).toBe('approved');
      expect(enrollment.handled_by_id).toBe(adminId);
    });

    test('should throw an error if enrollment is not found (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      mockEnrollmentModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow('Failed to approve enrollment');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error if updating enrollment fails (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn().mockRejectedValue(new Error('Save failed')) };
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment);

      // Act & Assert
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow('Failed to approve enrollment');
      expect(enrollment.save).toHaveBeenCalled();
    });
  });

  describe('rejectEnrollment', () => {
    test('should reject an enrollment successfully (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn() };
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment);

      // Act
      const result = await enrollmentService.rejectEnrollment(enrollmentId, adminId);

      // Assert
      expect(result).toEqual({ id: enrollmentId, status: 'rejected', handled_by_id: adminId, save: expect.any(Function) });
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
      expect(enrollment.save).toHaveBeenCalled();
      expect(enrollment.status).toBe('rejected');
      expect(enrollment.handled_by_id).toBe(adminId);
    });

    test('should throw an error if enrollment is not found (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      mockEnrollmentModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(enrollmentService.rejectEnrollment(enrollmentId, adminId)).rejects.toThrow('Failed to reject enrollment');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error if updating enrollment fails (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn().mockRejectedValue(new Error('Save failed')) };
      mockEnrollmentModel.findByPk.mockResolvedValue(enrollment);

      // Act & Assert
      await expect(enrollmentService.rejectEnrollment(enrollmentId, adminId)).rejects.toThrow('Failed to reject enrollment');
      expect(enrollment.save).toHaveBeenCalled();
    });
  });

  describe('getEnrollmentById', () => {
    test('should retrieve an enrollment by ID successfully (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1;
      const expectedEnrollment = { id: enrollmentId, ...validEnrollments[0] };
      mockEnrollmentModel.findByPk.mockResolvedValue(expectedEnrollment);

      // Act
      const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);

      // Assert
      expect(enrollment).toEqual(expectedEnrollment);
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error when the enrollment does not exist (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1;
      mockEnrollmentModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow('Failed to fetch enrollment');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error when fetching of enrollment fails (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1;
      mockEnrollmentModel.findByPk.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow('Failed to fetch enrollment');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });
  });

  describe('getAllEnrollments', () => {
    test('should retrieve all enrollments successfully (get all enrollments)', async () => {
      // Arrange
      const expectedEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }));
      mockEnrollmentModel.findAll.mockResolvedValue(expectedEnrollments);

      // Act
      const enrollments = await enrollmentService.getAllEnrollments();

      // Assert
      expect(enrollments).toEqual(expectedEnrollments);
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    });

    test('should return an empty array when no enrollments exist (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockResolvedValue([]);

      // Act
      const enrollments = await enrollmentService.getAllEnrollments();

      // Assert
      expect(enrollments).toEqual([]);
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    });

    test('should throw an error when fetching enrollments fails (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(enrollmentService.getAllEnrollments()).rejects.toThrow('Failed to fetch enrollments');
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    });
  });
});

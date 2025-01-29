import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import EnrollmentService from '../../../src/services/enrollmentService';
import { validEnrollments, invalidEnrollments } from '../../fixtures/enrollmentData';
import bcrypt from 'bcryptjs';

jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

const mockEnrollmentModel = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};

const mockSchoolModel = {
  findByPk: jest.fn(),
};

describe('Enrollment Service', () => {
  let enrollmentService;

  beforeEach(() => {
    enrollmentService = new EnrollmentService(mockEnrollmentModel, mockSchoolModel);
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
  
    test('should throw an error if email format is invalid (enroll)', async () => {
      // Arrange
      const invalidEmailEnrollment = { ...validEnrollments[0], email: 'invalid-email' };
  
      // Act & Assert
      await expect(
        enrollmentService.enroll(
          invalidEmailEnrollment.email,
          invalidEmailEnrollment.password,
          invalidEmailEnrollment.firstName,
          invalidEmailEnrollment.lastName,
          invalidEmailEnrollment.birthDate,
          invalidEmailEnrollment.contactNo,
          invalidEmailEnrollment.schoolId,
          invalidEmailEnrollment.yearLevel
        )
      ).rejects.toThrow('Invalid email format');
    });
  
    test('should throw an error if contact number format is invalid (enroll)', async () => {
      // Arrange
      const invalidContactNoEnrollment = { ...validEnrollments[0], contactNo: '12345' };
  
      // Act & Assert
      await expect(
        enrollmentService.enroll(
          invalidContactNoEnrollment.email,
          invalidContactNoEnrollment.password,
          invalidContactNoEnrollment.firstName,
          invalidContactNoEnrollment.lastName,
          invalidContactNoEnrollment.birthDate,
          invalidContactNoEnrollment.contactNo,
          invalidContactNoEnrollment.schoolId,
          invalidContactNoEnrollment.yearLevel
        )
      ).rejects.toThrow('Invalid contact number format');
    });
  
    test('should throw an error if password is too short (enroll)', async () => {
      // Arrange
      const shortPasswordEnrollment = { ...validEnrollments[0], password: 'short' };
  
      // Act & Assert
      await expect(
        enrollmentService.enroll(
          shortPasswordEnrollment.email,
          shortPasswordEnrollment.password,
          shortPasswordEnrollment.firstName,
          shortPasswordEnrollment.lastName,
          shortPasswordEnrollment.birthDate,
          shortPasswordEnrollment.contactNo,
          shortPasswordEnrollment.schoolId,
          shortPasswordEnrollment.yearLevel
        )
      ).rejects.toThrow('Password must be at least 8 characters long');
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
  
    test('should throw an error if enrollment fails (enroll)', async () => {
      // Arrange
      const validEnrollment = validEnrollments[0];
      bcrypt.hash.mockResolvedValue('hashed_password');
      mockEnrollmentModel.create.mockRejectedValue(new Error('Database error'));
  
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
      ).rejects.toThrow('Failed Enrollment');
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
      await expect(enrollmentService.approveEnrollment(enrollmentId, adminId)).rejects.toThrow('Enrollment not found');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error if updating enrollment fails (approve enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn().mockRejectedValue(new Error('Updating failed')) };
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
      await expect(enrollmentService.rejectEnrollment(enrollmentId, adminId)).rejects.toThrow('Enrollment not found');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId);
    });

    test('should throw an error if updating enrollment fails (reject enrollment)', async () => {
      // Arrange
      const enrollmentId = 1;
      const adminId = 99;
      const enrollment = { id: enrollmentId, status: 'pending', save: jest.fn().mockRejectedValue(new Error('Updating failed')) };
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
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, { attributes: { exclude: ['password'] } });
    });

    test('should throw an error when the enrollment does not exist (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1;
      mockEnrollmentModel.findByPk.mockResolvedValue(null);

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow('Enrollment not found');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, { attributes: { exclude: ['password'] } });
    });

    test('should throw an error when fetching of enrollment fails (get enrollment by id)', async () => {
      // Arrange
      const enrollmentId = 1;
      mockEnrollmentModel.findByPk.mockRejectedValue(new Error('Fetching error'));

      // Act & Assert
      await expect(enrollmentService.getEnrollmentById(enrollmentId)).rejects.toThrow('Failed to fetch enrollment');
      expect(mockEnrollmentModel.findByPk).toHaveBeenCalledWith(enrollmentId, { attributes: { exclude: ['password'] } });
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

    test('should throw an error when fetching enrollments fails (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(enrollmentService.getAllEnrollments()).rejects.toThrow('Failed to fetch enrollments');
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    });

    test('should return an empty list if no enrollments exist (get all enrollments)', async () => {
      // Arrange
      mockEnrollmentModel.findAll.mockResolvedValue([]);
    
      // Act
      const enrollments = await enrollmentService.getAllEnrollments();
    
      // Assert
      expect(enrollments).toEqual([]);
      expect(mockEnrollmentModel.findAll).toHaveBeenCalled();
    });
  });

  describe('getEnrollmentsBySchool', () => {
    test('should retrieve enrollments by school successfully (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1;
      const expectedEnrollments = [{ id: 1, school_id: schoolId, status: 'pending' }];
      mockSchoolModel.findByPk.mockResolvedValue({ id: schoolId });
      mockEnrollmentModel.findAll.mockResolvedValue(expectedEnrollments);
  
      // Act
      const enrollments = await enrollmentService.getEnrollmentsBySchool(schoolId);
  
      // Assert
      expect(enrollments).toEqual(expectedEnrollments);
      expect(mockEnrollmentModel.findAll).toHaveBeenCalledWith({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
      });
    });
  
    test('should throw an error if the school does not exist (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1;
      mockSchoolModel.findByPk.mockResolvedValue(null);
  
      // Act & Assert
      await expect(enrollmentService.getEnrollmentsBySchool(schoolId)).rejects.toThrow('School not found');
    });
  
    test('should throw an error if fetching enrollments by school fails (get enrollments by school)', async () => {
      // Arrange
      const schoolId = 1;
      mockSchoolModel.findByPk.mockResolvedValue({ id: schoolId });
      mockEnrollmentModel.findAll.mockRejectedValue(new Error('Database error'));
  
      // Act & Assert
      await expect(enrollmentService.getEnrollmentsBySchool(schoolId)).rejects.toThrow('Failed to fetch enrollments by school');
    });
  });
});

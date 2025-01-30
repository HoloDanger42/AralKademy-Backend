import { afterEach, jest, describe, test, beforeEach, expect } from '@jest/globals';
import { enroll, getEnrollmentById, approveEnrollment, rejectEnrollment, getAllEnrollments, getEnrollmentsBySchool } from '../../../src/controllers/enrollmentController.js';
import EnrollmentService from '../../../src/services/enrollmentService.js';
import { log } from '../../../src/utils/logger.js';
import { validEnrollments } from '../../fixtures/enrollmentData.js';

describe('Enrollment Controller', () => {
  let mockReq;
  let mockRes;
  let enrollSpy;
  let getEnrollmentByIdSpy;
  let approveEnrollmentSpy;
  let rejectEnrollmentSpy;
  let getAllEnrollmentsSpy;
  let getEnrollmentsBySchoolSpy;

  beforeEach(() => {
    mockReq = { body: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    enrollSpy = jest.spyOn(EnrollmentService.prototype, 'enroll');
    getEnrollmentByIdSpy = jest.spyOn(EnrollmentService.prototype, 'getEnrollmentById');
    approveEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'approveEnrollment');
    rejectEnrollmentSpy = jest.spyOn(EnrollmentService.prototype, 'rejectEnrollment');
    getAllEnrollmentsSpy = jest.spyOn(EnrollmentService.prototype, 'getAllEnrollments');
    getEnrollmentsBySchoolSpy = jest.spyOn(EnrollmentService.prototype, 'getEnrollmentsBySchool')

    jest.spyOn(log, 'info');
    jest.spyOn(log, 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enroll', () => {
    test('should create enrollment successfully (enroll)', async () => {
      // Arrange
      const enrollmentData = validEnrollments[0];
      mockReq.body = enrollmentData;
      const mockEnrollment = { id: 1, ...enrollmentData };
      enrollSpy.mockResolvedValue(mockEnrollment);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Enrollment created successfully',
        enrollment: mockEnrollment,
      });
      expect(log.info).toHaveBeenCalled();
    });
  
    test('should handle missing required fields (enroll)', async () => {
      // Arrange
      mockReq.body = { email: 'test@example.com' }; 
      const error = new Error('All fields are required');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'All fields are required' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  
    test('should handle duplicate email error (enroll)', async () => {
      // Arrange
      const enrollmentData = validEnrollments[0];
      mockReq.body = enrollmentData;
      const error = new Error('Email already exists');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email already exists' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  
    test('should handle invalid email format error (enroll)', async () => {
      // Arrange
      const invalidEmailEnrollment = { ...validEnrollments[0], email: 'invalid-email' };
      mockReq.body = invalidEmailEnrollment;
      const error = new Error('Invalid email format');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid email format' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  
    test('should handle invalid contact number format error (enroll)', async () => {
      // Arrange
      const invalidContactNoEnrollment = { ...validEnrollments[0], contactNo: '12345' }; 
      mockReq.body = invalidContactNoEnrollment;
      const error = new Error('Invalid contact number format');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid contact number format' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  
    test('should handle short password error (enroll)', async () => {
      // Arrange
      const shortPasswordEnrollment = { ...validEnrollments[0], password: 'short' };
      mockReq.body = shortPasswordEnrollment;
      const error = new Error('Password must be at least 8 characters long');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password must be at least 8 characters long' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  
    test('should handle unexpected server errors during enrollment (enroll)', async () => {
      // Arrange
      mockReq.body = validEnrollments[0];
      const error = new Error('Unexpected error');
      enrollSpy.mockRejectedValue(error);
  
      // Act
      await enroll(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to create enrollment' });
      expect(log.error).toHaveBeenCalledWith('Create enrollment error:', error);
    });
  });

  describe('getEnrollmentById', () => {
    test('should retrieve enrollment by ID successfully (get enrollment by id)', async () => {
      // Arrange
      mockReq.params.id = '1';
      const mockEnrollment = { id: 1, ...validEnrollments[0] };
      getEnrollmentByIdSpy.mockResolvedValue(mockEnrollment);

      // Act
      await getEnrollmentById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment);
      expect(log.info).toHaveBeenCalled();
    });

    test('should handle enrollment not found (get enrollment by id)', async () => {
      // Arrange
      mockReq.params.id = '99';
      const error = new Error('Enrollment not found');
      getEnrollmentByIdSpy.mockRejectedValue(error);

      // Act
      await getEnrollmentById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' });
      expect(log.error).toHaveBeenCalledWith('Get enrollment by ID error:', error);
    });

    test('should handle unexpected server errors during retrieval (get enrollment by id)', async () => {
      // Arrange
      mockReq.params.id = '1';
      const error = new Error('Unexpected error');
      getEnrollmentByIdSpy.mockRejectedValue(error);

      // Act
      await getEnrollmentById(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve enrollment' });
      expect(log.error).toHaveBeenCalledWith('Get enrollment by ID error:', error);
    });
  });

  describe('approveEnrollment', () => {
    test('should approve enrollment successfully (approve enrollment)', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1 }; 
      const mockEnrollment = { id: 1, status: 'approved' };
      approveEnrollmentSpy.mockResolvedValue(mockEnrollment);
  
      // Act
      await approveEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment);
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was approved');
    });
  
    test('should handle enrollment not found (approve enrollment)', async () => {
      // Arrange
      mockReq.params.id = '99';
      mockReq.user = { id: 1 };
      const error = new Error('Enrollment not found');
      approveEnrollmentSpy.mockRejectedValue(error);
  
      // Act
      await approveEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' });
      expect(log.error).toHaveBeenCalledWith('Approve enrollment error:', error);
    });
  
    test('should handle unexpected server errors during approval (approve enrollment)', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1 }; 
      const error = new TypeError('Unexpected error');
      approveEnrollmentSpy.mockRejectedValue(error);
  
      // Act
      await approveEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to approve enrollment' });
      expect(log.error).toHaveBeenCalledWith('Approve enrollment error:', error);
    });
  });
  
  describe('rejectEnrollment', () => {
    test('should reject enrollment successfully (reject enrollment)', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };  
      const mockEnrollment = { id: 1, status: 'rejected' };
      rejectEnrollmentSpy.mockResolvedValue(mockEnrollment);
  
      // Act
      await rejectEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollment);
      expect(log.info).toHaveBeenCalledWith('Enrollment with ID: 1 was rejected');
    });
  
    test('should handle enrollment not found during rejection (reject enrollment)', async () => {
      // Arrange
      mockReq.params.id = '99';
      mockReq.user = { id: 1 };
      const error = new Error('Enrollment not found');
      rejectEnrollmentSpy.mockRejectedValue(error);
  
      // Act
      await rejectEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Enrollment not found' });
      expect(log.error).toHaveBeenCalledWith('Reject enrollment error:', error);
    });
  
    test('should handle unexpected server errors during rejection (reject enrollment)', async () => {
      // Arrange
      mockReq.params.id = '1';
      mockReq.user = { id: 1 };
      const error = new TypeError('Unexpected error');
      rejectEnrollmentSpy.mockRejectedValue(error);
  
      // Act
      await rejectEnrollment(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to reject enrollment' });
      expect(log.error).toHaveBeenCalledWith('Reject enrollment error:', error);
    });
  });

  describe('getAllEnrollments', () => {
    test('should retrieve all enrollments successfully (get all enrollments)', async () => {
      // Arrange
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }));
      getAllEnrollmentsSpy.mockResolvedValue(mockEnrollments);

      // Act
      await getAllEnrollments(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments);
      expect(log.info).toHaveBeenCalled();
    });

    test('should handle unexpected server errors during retrieving all enrollments (get all enrollments)', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      getAllEnrollmentsSpy.mockRejectedValue(error);

      // Act
      await getAllEnrollments(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve enrollments' });
      expect(log.error).toHaveBeenCalledWith('Get all enrollments error:', error);
    });
  });

  describe('getEnrollmentsBySchool', () => {
    test('should retrieve enrollments by school ID successfully (get enrollments by school)', async () => {
      // Arrange
      const schoolId = '1';
      mockReq.params.schoolId = schoolId;
      const mockEnrollments = validEnrollments.map((enrollment, index) => ({
        id: index + 1,
        ...enrollment,
      }));
      getEnrollmentsBySchoolSpy.mockResolvedValue(mockEnrollments);
  
      // Act
      await getEnrollmentsBySchool(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockEnrollments);
      expect(log.info).toHaveBeenCalledWith(`Retrieved enrollments for school ID: ${schoolId}`);
      expect(getEnrollmentsBySchoolSpy).toHaveBeenCalledWith(schoolId);
    });
  
    test('should handle school not found (get enrollments by school)', async () => {
      // Arrange
      const schoolId = '99';
      mockReq.params.schoolId = schoolId;
      const error = new Error('School not found');
      getEnrollmentsBySchoolSpy.mockRejectedValue(error);
  
      // Act
      await getEnrollmentsBySchool(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'School not found' });
      expect(log.error).toHaveBeenCalledWith('Get enrollments by school error:', error);
    });
  
    test('should handle errors when retrieving enrollments by school (get enrollments by school)', async () => {
      // Arrange
      const schoolId = '1';
      mockReq.params.schoolId = schoolId;
      const error = new Error('Unexpected error');
      getEnrollmentsBySchoolSpy.mockRejectedValue(error);
  
      // Act
      await getEnrollmentsBySchool(mockReq, mockRes);
  
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve enrollments by school' });
      expect(log.error).toHaveBeenCalledWith('Get enrollments by school error:', error);
    });
  });
});

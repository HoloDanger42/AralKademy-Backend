// controllers/enrollmentController.js
import EnrollmentService from '../services/enrollmentService.js';
import { Enrollment } from '../models/Enrollment.js';
import { School } from '../models/School.js';
import { log } from '../utils/logger.js';

const enrollmentService = new EnrollmentService(Enrollment, School);

const enroll = async (req, res) => {
  try {
    const { email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById, status } = req.body;
    const enrollment = await enrollmentService.enroll(email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById, status);

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollment,
    });
    log.info(`Enrollment ${email} created successfully`);
  } catch (error) {
    log.error('Create enrollment error:', error);
    if (error.message === 'Email already exists') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'All fields are required') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Invalid email format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Invalid contact number format') {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Password must be at least 8 characters long') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to create enrollment' });
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const enrollment = await enrollmentService.getEnrollmentById(enrollmentId);
    res.status(200).json(enrollment);
    log.info(`Retrieved enrollment with ID: ${enrollmentId}`);
  } catch (error) {
    log.error('Get enrollment by ID error:', error);
    if (error.message === 'Enrollment not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to retrieve enrollment' });
  }
};

const approveEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const adminId = req.user.id;  
    const enrollment = await enrollmentService.approveEnrollment(enrollmentId, adminId);
    res.status(200).json(enrollment);
    log.info(`Enrollment with ID: ${enrollmentId} was approved`);
  } catch (error) {
    log.error('Approve enrollment error:', error);
    if (error.message === 'Enrollment not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to approve enrollment' });
  }
};

const rejectEnrollment = async (req, res) => {
  try {
    const enrollmentId = req.params.id;
    const adminId = req.user.id; // Assuming you have authentication middleware
    const enrollment = await enrollmentService.rejectEnrollment(enrollmentId, adminId);
    res.status(200).json(enrollment);
    log.info(`Enrollment with ID: ${enrollmentId} was rejected`);
  } catch (error) {
    log.error('Reject enrollment error:', error);
    if (error.message === 'Enrollment not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to reject enrollment' });
  }
};

const getAllEnrollments = async (_req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.status(200).json(enrollments);
    log.info('Retrieved all enrollments');
  } catch (error) {
    log.error('Get all enrollments error:', error);
    return res.status(500).json({ message: 'Failed to retrieve enrollments' });
  }
};

const getEnrollmentsBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const enrollments = await enrollmentService.getEnrollmentsBySchool(schoolId);
    res.status(200).json(enrollments);
    log.info(`Retrieved enrollments for school ID: ${schoolId}`);
  } catch (error) {
    log.error('Get enrollments by school error:', error);
    if (error.message === 'School not found') {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to retrieve enrollments by school' });
  }
};

// Function to check enrollment status
const checkEnrollmentStatus = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const status = await enrollmentService.checkEnrollmentStatus(email); // Use the service

        if (!status) {
            return res.status(404).json({ message: 'Enrollment not found for this email' });
        }

        res.status(200).json({ status });

    } catch (error) {
        log.error('Error checking enrollment status:', error);
        return res.status(500).json({message: 'Failed to check enrollment status'});
    }
};

export { getAllEnrollments, enroll, getEnrollmentById, approveEnrollment, rejectEnrollment, getEnrollmentsBySchool, checkEnrollmentStatus }; // Export the new function
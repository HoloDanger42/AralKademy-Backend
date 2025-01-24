import EnrollmentService from '../services/enrollmentService.js';
import { Enrollment } from '../models/Enrollment.js';
import { log } from '../utils/logger.js';

const enrollmentService = new EnrollmentService(Enrollment);

const enroll = async (req, res) => {
  try {
    const { email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById, status} = req.body;
    const enrollment = await enrollmentService.enroll(email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById, status);

    res.status(201).json({
      message: 'Enrollment created successfully',
      enrollment,
    });
    log.info(`Enrollment ${email} created successfully`);
  } catch (error) {
    log.error('Create enrollment error:', error);
    if (error.message === 'Enrollment already exists') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to create enrollment' });
  }
}

const getAllEnrollments = async (_req, res) => {
  try {
    const enrollments = await enrollmentService.getAllEnrollments();
    res.status(200).json(enrollments);
    log.info('Retrieved all enrollments');
  } catch (error) {
    log.error('Get all enrollments error:', error);
    return res.status(500).json({ message: 'Failed to retrieve enrollments' });
  }
}



export { getAllEnrollments, enroll };
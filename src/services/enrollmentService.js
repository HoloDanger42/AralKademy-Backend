import bcrypt from 'bcryptjs';

class EnrollmentService {
  constructor(EnrollmentModel) {
    this.EnrollmentModel = EnrollmentModel;
  }

  async approveEnrollment(enrollmentId, adminId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }
      enrollment.status = 'approved';
      enrollment.handled_by_id = adminId;
      await enrollment.save();
      return enrollment;
    } catch (error) {
      throw new Error('Failed to approve enrollment');
    }
  }

  async rejectEnrollment(enrollmentId, adminId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }
      enrollment.status = 'rejected';
      enrollment.handled_by_id = adminId;
      await enrollment.save();
      return enrollment;
    } catch (error) {
      throw new Error('Failed to reject enrollment');
    }
  }

  async enroll(email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById = null, status = 'pending') {
    try {

      if (!email || !password || !firstName || !lastName || !birthDate || !contactNo || !schoolId || !yearLevel) {
        throw new Error('All fields are required');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      return await this.EnrollmentModel.create({
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        contact_no: contactNo,
        school_id: schoolId,
        year_level: yearLevel,
        handled_by_id: handledById,
        status
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors[0].path === 'email') {
          throw new Error('Email already exists');
        }
      }
      throw error;
    }
  }

  async getAllEnrollments() {
    try {
      return await this.EnrollmentModel.findAll();
    } catch (error) {
      throw new Error('Failed to fetch enrollments');
    }
  }

  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }
      return enrollment;
    } catch (error) {
      throw new Error('Failed to fetch enrollment');
    }
  }
}

export default EnrollmentService;
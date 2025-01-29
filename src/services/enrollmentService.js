import bcrypt from 'bcryptjs';

class EnrollmentService {
  constructor(EnrollmentModel, SchoolModel) {
    this.EnrollmentModel = EnrollmentModel;
    this.SchoolModel = SchoolModel;
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
      if (error.message === 'Enrollment not found') {
        throw error;
      }
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
      if (error.message === 'Enrollment not found') {
        throw error;
      }
      throw new Error('Failed to reject enrollment');
    }
  }


  async enroll(email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById = null, status = 'pending') {
    if (!email || !password || !firstName || !lastName || !birthDate || !contactNo || !schoolId || !yearLevel) {
      throw new Error('All fields are required');
    }

    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).test(email)) {
      throw new Error('Invalid email format');
    }

    if (!(/^09\d{9}$/).test(contactNo)) {
      throw new Error('Invalid contact number format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    try {
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
      throw new Error('Failed Enrollment');
    }
  }

  async getAllEnrollments() {
    try {
      return await this.EnrollmentModel.findAll({
        attributes: { exclude: ['password'] }
      });
    } catch (error) {
      throw new Error('Failed to fetch enrollments');
    }
  }

  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId, {
        attributes: { exclude: ['password'] }  // Exclude the password field
      });
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }
      return enrollment;
    } catch (error) {
      if (error.message === 'Enrollment not found') {
        throw error;
      }
      throw new Error('Failed to fetch enrollment');
    }
  }

  async getEnrollmentsBySchool(schoolId) {
    try {
      const school = await this.SchoolModel.findByPk(schoolId);
      if (!school) {
        throw new Error('School not found');
      }
  
      const enrollments = await this.EnrollmentModel.findAll({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] }
      });
  
      return enrollments;
    } catch (error) {
      if (error.message === 'School not found') {
        throw error;
      }
      throw new Error('Failed to fetch enrollments by school');
    }
  }
}

export default EnrollmentService;
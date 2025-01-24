import bcrypt from 'bcryptjs';

class EnrollmentService {
  constructor(EnrollmentModel) {
    this.EnrollmentModel = EnrollmentModel;
  }

  async enroll(email, password, firstName, lastName, birthDate, contactNo, schoolId, yearLevel, handledById = null, status = 'pending') {
    try {
      const hashedPassword = await bcrypt.hash(password, 10)
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
      })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors[0].path === 'email') {
          throw new Error('Email already exists')
        }
      }
      throw error
    }
  }

  async getAllEnrollments() {
    return await this.EnrollmentModel.findAll();
  }
}

export default EnrollmentService;
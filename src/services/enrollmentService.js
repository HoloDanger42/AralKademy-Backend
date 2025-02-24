import bcrypt from 'bcryptjs';
import { log } from '../utils/logger.js';

class EnrollmentService {
    constructor(EnrollmentModel, SchoolModel, UserModel, LearnerModel) {
        this.EnrollmentModel = EnrollmentModel;
        this.SchoolModel = SchoolModel;
        this.UserModel = UserModel;
        this.LearnerModel = LearnerModel;
    }

    async createEnrollment(enrollmentData) {
        try {
            // 1. Hash the password (using bcrypt)
            const hashedPassword = await bcrypt.hash(enrollmentData.password, 12); 
            // 2. Set default values
            enrollmentData.handled_by_id = enrollmentData.handled_by_id || 4; // Default admin ID - 4 (for dev)
            enrollmentData.status = enrollmentData.status || 'pending'; // Default status

            // 3. Replace the plaintext password with the HASHED password
            enrollmentData.password = hashedPassword;
            delete enrollmentData.confirm_password; 

            // 4. Create the enrollment record (no try-catch for Sequelize errors here)
            const newEnrollment = await this.EnrollmentModel.create(enrollmentData);
            return newEnrollment;

        } catch (error) {
            log.error('Error creating enrollment in service:', error);
              // Handle unique constraint errors (e.g., duplicate email)
            if (error.name === 'SequelizeUniqueConstraintError') {
                throw new Error('Email already exists'); 
            }
             if (error.name === 'SequelizeValidationError') { 
                 throw error;
            }

            throw new Error('Failed to create enrollment'); // Generic error for other issues
        }
    }
    async approveEnrollment(enrollmentId, adminId) {
      try {
          const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);
  
          if (!enrollment) {
              throw new Error('Enrollment not found');
          }
  
          const user = await this.UserModel.findOne({ where: { email: enrollment.email } });
  
          // IMPORTANT:  If the user does NOT exist at this point, it indicates a
          // serious data integrity problem.
          if (!user) {
              throw new Error(`User with email ${enrollment.email} not found.  Data integrity issue.`);
          }
          // Check if learner exists using user_id AND enrollment_id
          let learner = await this.LearnerModel.findOne({
              where: {
                  user_id: user.id,
                  enrollment_id: enrollment.enrollment_id
              }
          });
  
  
          if (!learner) {
              // Create the learner record.
              learner = await this.LearnerModel.create({
                  user_id: user.id,
                  year_level: enrollment.year_level,
                  enrollment_id: enrollment.enrollment_id,
              });
          }
  
          enrollment.status = 'approved';
          enrollment.handled_by_id = adminId;  // The admin approving the enrollment
          await enrollment.save();
  
          return enrollment;
  
      } catch (error) {
          log.error('Error approving enrollment:', error);
          throw error; // Re-throw for consistent error handling
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
      log.error('Error rejecting enrollment:', error);
      throw error; // Re-throw for consistent error handling
    }
  }

    async getAllEnrollments() {
        try {
            const enrollments = await this.EnrollmentModel.findAll({
                attributes: { exclude: ['password'] }, // Exclude password
                 include: [{ model: this.SchoolModel, as: 'school' }], // Include associated school
            });
            return enrollments;
        } catch (error) {
            log.error('Error fetching all enrollments:', error);
            throw new Error('Failed to fetch enrollments');
        }
    }

    async getEnrollmentById(enrollmentId) {
        try {
            const enrollment = await this.EnrollmentModel.findByPk(enrollmentId, {
                attributes: { exclude: ['password'] },
                 include: [{ model: this.SchoolModel, as: 'school' }],
            });

            if (!enrollment) {
                throw new Error('Enrollment not found');
            }
            return enrollment;

        } catch (error) {
            log.error('Error fetching enrollment by ID:', error);
             throw error; // Re-throw for consistent error handling
        }
    }


  async getEnrollmentsBySchool(schoolId) {
    try {
        const school = await this.SchoolModel.findByPk(schoolId);
        if(!school){
            throw new Error('School not found');
        }
      const enrollments = await this.EnrollmentModel.findAll({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
        include: [{ model: this.SchoolModel, as: 'school' }],
      });

      return enrollments;
    } catch (error) {
      log.error('Error fetching enrollments by school:', error);
      throw error; // Re-throw for consistent error handling
    }
  }
    async checkEnrollmentStatus(email) {
        try {
            const enrollment = await this.EnrollmentModel.findOne({
                where: { email: email },
                attributes: ['status']
            });

            if (!enrollment) {
                return null; 
            }

            return enrollment.status;

        } catch (error) {
            log.error('Error checking enrollment status:', error);
            throw error; // Consistent error handling
        }
    }

    async updateEnrollment(enrollmentId, updatedData) {
        try {
            const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);

            if (!enrollment) {
                throw new Error('Enrollment not found');
            }

            // *** IMPORTANT: Prevent password updates through this route ***
            delete updatedData.password;
            delete updatedData.confirm_password;

            const updatedEnrollment = await enrollment.update(updatedData);
            return updatedEnrollment;

        } catch (error) {
            log.error('Error updating enrollment in service:', error);
              if (error.name === 'SequelizeValidationError') {
                 throw error;
            }
            if(error.name === 'SequelizeUniqueConstraintError'){
                throw new Error('Email already exists')
            }
            throw error; // Re-throw for consistent error handling
        }
    }

    async deleteEnrollment(enrollmentId) {
        try {
            const enrollment = await this.EnrollmentModel.findByPk(enrollmentId);
            if (!enrollment) {
                throw new Error('Enrollment not found');
            }
            await enrollment.destroy(); // Soft delete (paranoid: true)
        } catch (error) {
            log.error('Error deleting enrollment in service:', error);
            throw error;  // Re-throw for consistent error handling
        }
    }
}

export default EnrollmentService;
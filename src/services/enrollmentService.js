<<<<<<< HEAD
import bcrypt from 'bcryptjs'
import { log } from '../utils/logger.js'
import { Sequelize } from 'sequelize';

/**
 * Service class that manages enrollment operations in the system.
 *
 * This service handles the complete lifecycle of enrollment records including:
 * - Creating enrollment applications
 * - Approving enrollments and creating associated learner records
 * - Rejecting enrollments
 * - Retrieving enrollment information (single, all, or by school)
 * - Checking enrollment status
 * - Updating enrollment records
 * - Deleting enrollments (soft delete)
 *
 * @class EnrollmentService
 * @description Manages the business logic for student enrollment processes
 * @requires bcrypt - For password hashing
 * @requires log - For logging errors and operations
 */
class EnrollmentService {
  /**
   * Creates an instance of the EnrollmentService.
   * @constructor
   * @param {Object} EnrollmentModel - The model for enrollment data.
   * @param {Object} SchoolModel - The model for school data.
   * @param {Object} UserModel - The model for user data.
   * @param {Object} LearnerModel - The model for learner data.
   */
  constructor(EnrollmentModel, SchoolModel, UserModel, LearnerModel) {
    this.EnrollmentModel = EnrollmentModel
    this.SchoolModel = SchoolModel
    this.UserModel = UserModel
    this.LearnerModel = LearnerModel
  }

  /**
   * Creates a new enrollment record
   *
   * @async
   * @param {Object} enrollmentData - The enrollment information
   * @param {string} enrollmentData.password - The user's plaintext password (will be hashed)
   * @param {string} [enrollmentData.confirm_password] - Password confirmation (will be removed)
   * @param {string} [enrollmentData.handled_by_id] - ID of admin handling the enrollment (defaults to null)
   * @param {string} [enrollmentData.status] - Enrollment status (defaults to 'pending')
   * @param {string} enrollmentData.email - User's email address (must be unique)
   *
   * @returns {Promise<Object>} The created enrollment record
   *
   * @throws {Error} If email already exists ("Email already exists")
   * @throws {Error} If there's a validation error (passes through Sequelize validation errors)
   * @throws {Error} For any other errors ("Failed to create enrollment")
   */
  async createEnrollment(enrollmentData) {
    try {
      const existingUser = await this.UserModel.findOne({
        where: {
          email: enrollmentData.email
        },
      });
  
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // 1. Hash the password (using bcrypt)
      const hashedPassword = await bcrypt.hash(enrollmentData.password, 12)

      // 2. Set default values
      enrollmentData.handled_by_id = enrollmentData.handled_by_id || null
      enrollmentData.status = enrollmentData.status || 'pending' // Default status

      // 3. Replace the plaintext password with the HASHED password
      enrollmentData.password = hashedPassword
      delete enrollmentData.confirm_password

      // 4. Create the enrollment record (no try-catch for Sequelize errors here)
      const newEnrollment = await this.EnrollmentModel.create(enrollmentData)

      return newEnrollment
    } catch (error) {
      log.error('Error creating enrollment in service:', error)

      if (error.message === 'Email already exists') {
        throw error
      }
      // Handle unique constraint errors (e.g., duplicate email)
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }
      
      if (error.name === 'SequelizeValidationError') {
        throw error
      }

      throw new Error('Failed to create enrollment') // Generic error for other issues
    }
  }

  /**
   * Approves an enrollment application and creates a learner record if it doesn't exist.
   *
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to approve
   * @param {number|string} adminId - The ID of the admin handling the approval
   * @returns {Promise<Object>} The updated enrollment record with status set to 'approved'
   * @throws {Error} If enrollment is not found
   * @throws {Error} If the associated user is not found (indicating data integrity issues)
   * @throws {Error} If there's any error during the approval process
   */
  async approveEnrollment(enrollmentId, adminId) {
    const transaction = await this.EnrollmentModel.sequelize.transaction()

    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      enrollment.status = 'approved'
      enrollment.handled_by_id = adminId
      await enrollment.save({ transaction })

      // Create a user with the learner role using enrollment data
      const hashedPassword = enrollment.password

      const userData = {
        email: enrollment.email,
        password: hashedPassword,
        first_name: enrollment.first_name,
        last_name: enrollment.last_name,
        middle_initial: enrollment.middle_initial,
        birth_date: enrollment.birth_date,
        contact_no: enrollment.contact_no,
        school_id: enrollment.school_id,
        role: 'learner',
      }

      // Create the user
      const newUser = await this.UserModel.create(userData, { transaction })

      // Create learner record associated with the new user
      await this.LearnerModel.create(
        {
          user_id: newUser.id,
          year_level: enrollment.year_level,
          enrollment_id: enrollment.enrollment_id,
        },
        { transaction }
      )

      await transaction.commit()
      return enrollment
    } catch (error) {
      await transaction.rollback()
      log.error('Error approving enrollment:', error)

      // Handle unique constraint violation (course name)
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }

      if (error.message === 'Enrollment not found') {
        throw error
      }

      throw new Error('Failed to approve enrollment')
    }
  }

  /**
   * Rejects an enrollment request by updating its status and setting the admin who handled it
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to reject
   * @param {number|string} adminId - The ID of the admin who is rejecting the enrollment
   * @returns {Promise<Object>} The updated enrollment object
   * @throws {Error} If the enrollment is not found or if there's an issue during the update process
   */
  async rejectEnrollment(enrollmentId, adminId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)
      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      enrollment.status = 'rejected'
      enrollment.handled_by_id = adminId
      await enrollment.save()
      return enrollment
    } catch (error) {
      log.error('Error rejecting enrollment:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error ('Failed to reject enrollment')
    }
  }

  /**
   * Retrieves all enrollments from the database
   * @async
   * @function getAllEnrollments
   * @returns {Promise<Array>} Array of enrollment objects with associated school data
   * @throws {Error} If there's an error fetching the enrollments from the database
   * @description Fetches all enrollment records from the database, excluding password fields
   * and including the associated school information for each enrollment
   */
  async getAllEnrollments(status, page = 1, limit = 10) {
    try {
      const queryOptions = {
        limit,
        offset: (page - 1) * limit,
        attributes: { exclude: ['password'] }, // Exclude password
        include: [{ model: this.SchoolModel, as: 'school' }], // Include associated school
      }

      // Add status filter if provided
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        queryOptions.where = { status }
      }

      const { count, rows } = await this.EnrollmentModel.findAndCountAll(queryOptions);

      const statusCounts = await this.EnrollmentModel.findAll({
            attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']],
            group: ['status'],
            raw: true
      });

      return { count, rows, statusCounts };
    } catch (error) {
      log.error('Error fetching all enrollments:', error)
      throw new Error('Failed to fetch enrollments')
    }
  }

  /**
   * Retrieves an enrollment record by its ID
   * @param {number|string} enrollmentId - The unique identifier of the enrollment to retrieve
   * @returns {Promise<Object>} The enrollment object with its associated school data (password excluded)
   * @throws {Error} If the enrollment is not found or if there's a database error
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId, {
        attributes: { exclude: ['password'] },
        include: [{ model: this.SchoolModel, as: 'school' }],
      })

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      return enrollment
    } catch (error) {
      log.error('Error fetching enrollment by ID:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollment')
    }
  }

  /**
   * Retrieves all enrollments associated with a specific school.
   *
   * @async
   * @param {number|string} schoolId - The ID of the school to fetch enrollments for
   * @returns {Promise<Array>} A promise that resolves to an array of enrollment objects
   * @throws {Error} If the school is not found or if there's an error fetching enrollments
   *
   * @example
   * // Get all enrollments for school with ID 123
   * const enrollments = await enrollmentService.getEnrollmentsBySchool(123);
   */
  async getEnrollmentsBySchool(schoolId) {
    try {
      const school = await this.SchoolModel.findByPk(schoolId)
      if (!school) {
        throw new Error('School not found')
      }
      const enrollments = await this.EnrollmentModel.findAll({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
        include: [{ model: this.SchoolModel, as: 'school' }],
      })

      return enrollments
    } catch (error) {
      log.error('Error fetching enrollments by school:', error)
      if (error.message === 'School not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollments by school')
    }
  }

  /**
   * Checks the enrollment status of a user by their email.
   * @async
   * @param {string} email - The email address of the user to check enrollment status for
   * @returns {Promise<string|null>} The enrollment status if found, or null if no enrollment exists
   * @throws {Error} If there's an error during the database operation
   */
  async checkEnrollmentStatus(email) {
    try {
      const enrollment = await this.EnrollmentModel.findOne({
        where: { email: email },
        attributes: ['status'],
      })

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      return enrollment.status
    } catch (error) {
      log.error('Error checking enrollment status:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollment status')
    }
  }

  /**
   * Updates an enrollment record in the database with the provided data
   *
   * @async
   * @param {number|string} enrollmentId - The unique identifier of the enrollment to update
   * @param {Object} updatedData - The data to update the enrollment with
   * @returns {Promise<Object>} The updated enrollment record
   * @throws {Error} When enrollment is not found
   * @throws {SequelizeValidationError} When validation fails
   * @throws {Error} When email already exists (from SequelizeUniqueConstraintError)
   *
   * @description
   * This method finds an enrollment by ID and updates it with the provided data.
   * Password fields are explicitly removed from the update data for security.
   * Various database-related errors are caught and handled appropriately.
   */
  async updateEnrollment(enrollmentId, updatedData) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const existingUser = await this.UserModel.findOne({
        where: {
          email: updatedData.email
        },
      });
  
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // *** IMPORTANT: Prevent password updates through this route ***
      delete updatedData.password
      delete updatedData.confirm_password

      const updatedEnrollment = await enrollment.update(updatedData)

      return updatedEnrollment
    } catch (error) {
      log.error('Error updating enrollment in service:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      if (error.message === 'Email already exists') {
        throw error
      }
      if (error.name === 'SequelizeValidationError') {
        throw error
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }
      throw new Error('Failed to update enrollment')
    }
  }

  /**
   * Deletes an enrollment by its ID (uses soft delete if paranoid is true)
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to delete
   * @throws {Error} Throws an error if the enrollment is not found or deletion fails
   * @returns {Promise<void>} A promise that resolves when the enrollment is deleted
   */
  async deleteEnrollment(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)
      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      await enrollment.destroy() // Soft delete (paranoid: true)
    } catch (error) {
      log.error('Error deleting enrollment in service:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to delete enrollment')
    }
  }
}

export default EnrollmentService
=======
import bcrypt from 'bcryptjs'
import { log } from '../utils/logger.js'
import { Sequelize } from 'sequelize';

/**
 * Service class that manages enrollment operations in the system.
 *
 * This service handles the complete lifecycle of enrollment records including:
 * - Creating enrollment applications
 * - Approving enrollments and creating associated learner records
 * - Rejecting enrollments
 * - Retrieving enrollment information (single, all, or by school)
 * - Checking enrollment status
 * - Updating enrollment records
 * - Deleting enrollments (soft delete)
 *
 * @class EnrollmentService
 * @description Manages the business logic for student enrollment processes
 * @requires bcrypt - For password hashing
 * @requires log - For logging errors and operations
 */
class EnrollmentService {
  /**
   * Creates an instance of the EnrollmentService.
   * @constructor
   * @param {Object} EnrollmentModel - The model for enrollment data.
   * @param {Object} SchoolModel - The model for school data.
   * @param {Object} UserModel - The model for user data.
   * @param {Object} LearnerModel - The model for learner data.
   */
  constructor(EnrollmentModel, SchoolModel, UserModel, LearnerModel) {
    this.EnrollmentModel = EnrollmentModel
    this.SchoolModel = SchoolModel
    this.UserModel = UserModel
    this.LearnerModel = LearnerModel
  }

  /**
   * Creates a new enrollment record
   *
   * @async
   * @param {Object} enrollmentData - The enrollment information
   * @param {string} enrollmentData.password - The user's plaintext password (will be hashed)
   * @param {string} [enrollmentData.confirm_password] - Password confirmation (will be removed)
   * @param {string} [enrollmentData.handled_by_id] - ID of admin handling the enrollment (defaults to null)
   * @param {string} [enrollmentData.status] - Enrollment status (defaults to 'pending')
   * @param {string} enrollmentData.email - User's email address (must be unique)
   *
   * @returns {Promise<Object>} The created enrollment record
   *
   * @throws {Error} If email already exists ("Email already exists")
   * @throws {Error} If there's a validation error (passes through Sequelize validation errors)
   * @throws {Error} For any other errors ("Failed to create enrollment")
   */
  async createEnrollment(enrollmentData) {
    try {
      const existingUser = await this.UserModel.findOne({
        where: {
          email: enrollmentData.email
        },
      });
  
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // 1. Hash the password (using bcrypt)
      const hashedPassword = await bcrypt.hash(enrollmentData.password, 12)

      // 2. Set default values
      enrollmentData.handled_by_id = enrollmentData.handled_by_id || null
      enrollmentData.status = enrollmentData.status || 'pending' // Default status

      // 3. Replace the plaintext password with the HASHED password
      enrollmentData.password = hashedPassword
      delete enrollmentData.confirm_password

      // 4. Create the enrollment record (no try-catch for Sequelize errors here)
      const newEnrollment = await this.EnrollmentModel.create(enrollmentData)

      return newEnrollment
    } catch (error) {
      log.error('Error creating enrollment in service:', error)

      if (error.message === 'Email already exists') {
        throw error
      }
      // Handle unique constraint errors (e.g., duplicate email)
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }
      
      if (error.name === 'SequelizeValidationError') {
        throw error
      }

      throw new Error('Failed to create enrollment') // Generic error for other issues
    }
  }

  /**
   * Approves an enrollment application and creates a learner record if it doesn't exist.
   *
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to approve
   * @param {number|string} adminId - The ID of the admin handling the approval
   * @returns {Promise<Object>} The updated enrollment record with status set to 'approved'
   * @throws {Error} If enrollment is not found
   * @throws {Error} If the associated user is not found (indicating data integrity issues)
   * @throws {Error} If there's any error during the approval process
   */
  async approveEnrollment(enrollmentId, adminId) {
    const transaction = await this.EnrollmentModel.sequelize.transaction()

    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      enrollment.status = 'approved'
      enrollment.handled_by_id = adminId
      await enrollment.save({ transaction })

      // Create a user with the learner role using enrollment data
      const hashedPassword = enrollment.password

      const userData = {
        email: enrollment.email,
        password: hashedPassword,
        first_name: enrollment.first_name,
        last_name: enrollment.last_name,
        middle_initial: enrollment.middle_initial,
        birth_date: enrollment.birth_date,
        contact_no: enrollment.contact_no,
        school_id: enrollment.school_id,
        role: 'learner',
      }

      // Create the user
      const newUser = await this.UserModel.create(userData, { transaction })

      // Create learner record associated with the new user
      await this.LearnerModel.create(
        {
          user_id: newUser.id,
          year_level: enrollment.year_level,
          enrollment_id: enrollment.enrollment_id,
        },
        { transaction }
      )

      await transaction.commit()
      return enrollment
    } catch (error) {
      await transaction.rollback()
      log.error('Error approving enrollment:', error)

      // Handle unique constraint violation (course name)
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }

      if (error.message === 'Enrollment not found') {
        throw error
      }

      throw new Error('Failed to approve enrollment')
    }
  }

  /**
   * Rejects an enrollment request by updating its status and setting the admin who handled it
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to reject
   * @param {number|string} adminId - The ID of the admin who is rejecting the enrollment
   * @returns {Promise<Object>} The updated enrollment object
   * @throws {Error} If the enrollment is not found or if there's an issue during the update process
   */
  async rejectEnrollment(enrollmentId, adminId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)
      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      enrollment.status = 'rejected'
      enrollment.handled_by_id = adminId
      await enrollment.save()
      return enrollment
    } catch (error) {
      log.error('Error rejecting enrollment:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error ('Failed to reject enrollment')
    }
  }

  /**
   * Retrieves all enrollments from the database
   * @async
   * @function getAllEnrollments
   * @returns {Promise<Array>} Array of enrollment objects with associated school data
   * @throws {Error} If there's an error fetching the enrollments from the database
   * @description Fetches all enrollment records from the database, excluding password fields
   * and including the associated school information for each enrollment
   */
  async getAllEnrollments(status, page = 1, limit = 10) {
    try {
      const queryOptions = {
        limit,
        offset: (page - 1) * limit,
        attributes: { exclude: ['password'] }, // Exclude password
        include: [{ model: this.SchoolModel, as: 'school' }], // Include associated school
      }

      // Add status filter if provided
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        queryOptions.where = { status }
      }

      const { count, rows } = await this.EnrollmentModel.findAndCountAll(queryOptions);

      const statusCounts = await this.EnrollmentModel.findAll({
            attributes: ['status', [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']],
            group: ['status'],
            raw: true
      });

      return { count, rows, statusCounts };
    } catch (error) {
      log.error('Error fetching all enrollments:', error)
      throw new Error('Failed to fetch enrollments')
    }
  }

  /**
   * Retrieves an enrollment record by its ID
   * @param {number|string} enrollmentId - The unique identifier of the enrollment to retrieve
   * @returns {Promise<Object>} The enrollment object with its associated school data (password excluded)
   * @throws {Error} If the enrollment is not found or if there's a database error
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId, {
        attributes: { exclude: ['password'] },
        include: [{ model: this.SchoolModel, as: 'school' }],
      })

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      return enrollment
    } catch (error) {
      log.error('Error fetching enrollment by ID:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollment')
    }
  }

  /**
   * Retrieves all enrollments associated with a specific school.
   *
   * @async
   * @param {number|string} schoolId - The ID of the school to fetch enrollments for
   * @returns {Promise<Array>} A promise that resolves to an array of enrollment objects
   * @throws {Error} If the school is not found or if there's an error fetching enrollments
   *
   * @example
   * // Get all enrollments for school with ID 123
   * const enrollments = await enrollmentService.getEnrollmentsBySchool(123);
   */
  async getEnrollmentsBySchool(schoolId) {
    try {
      const school = await this.SchoolModel.findByPk(schoolId)
      if (!school) {
        throw new Error('School not found')
      }
      const enrollments = await this.EnrollmentModel.findAll({
        where: { school_id: schoolId },
        attributes: { exclude: ['password'] },
        include: [{ model: this.SchoolModel, as: 'school' }],
      })

      return enrollments
    } catch (error) {
      log.error('Error fetching enrollments by school:', error)
      if (error.message === 'School not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollments by school')
    }
  }

  /**
   * Checks the enrollment status of a user by their email.
   * @async
   * @param {string} email - The email address of the user to check enrollment status for
   * @returns {Promise<string|null>} The enrollment status if found, or null if no enrollment exists
   * @throws {Error} If there's an error during the database operation
   */
  async checkEnrollmentStatus(email) {
    try {
      const enrollment = await this.EnrollmentModel.findOne({
        where: { email: email },
        attributes: ['status'],
      })

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      return enrollment.status
    } catch (error) {
      log.error('Error checking enrollment status:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to fetch enrollment status')
    }
  }

  /**
   * Updates an enrollment record in the database with the provided data
   *
   * @async
   * @param {number|string} enrollmentId - The unique identifier of the enrollment to update
   * @param {Object} updatedData - The data to update the enrollment with
   * @returns {Promise<Object>} The updated enrollment record
   * @throws {Error} When enrollment is not found
   * @throws {SequelizeValidationError} When validation fails
   * @throws {Error} When email already exists (from SequelizeUniqueConstraintError)
   *
   * @description
   * This method finds an enrollment by ID and updates it with the provided data.
   * Password fields are explicitly removed from the update data for security.
   * Various database-related errors are caught and handled appropriately.
   */
  async updateEnrollment(enrollmentId, updatedData) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)

      if (!enrollment) {
        throw new Error('Enrollment not found')
      }

      const existingUser = await this.UserModel.findOne({
        where: {
          email: updatedData.email
        },
      });
  
      if (existingUser) {
        throw new Error('Email already exists');
      }

      // *** IMPORTANT: Prevent password updates through this route ***
      delete updatedData.password
      delete updatedData.confirm_password

      const updatedEnrollment = await enrollment.update(updatedData)

      return updatedEnrollment
    } catch (error) {
      log.error('Error updating enrollment in service:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      if (error.message === 'Email already exists') {
        throw error
      }
      if (error.name === 'SequelizeValidationError') {
        throw error
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw error
      }
      throw new Error('Failed to update enrollment')
    }
  }

  /**
   * Deletes an enrollment by its ID (uses soft delete if paranoid is true)
   * @async
   * @param {number|string} enrollmentId - The ID of the enrollment to delete
   * @throws {Error} Throws an error if the enrollment is not found or deletion fails
   * @returns {Promise<void>} A promise that resolves when the enrollment is deleted
   */
  async deleteEnrollment(enrollmentId) {
    try {
      const enrollment = await this.EnrollmentModel.findByPk(enrollmentId)
      if (!enrollment) {
        throw new Error('Enrollment not found')
      }
      await enrollment.destroy() // Soft delete (paranoid: true)
    } catch (error) {
      log.error('Error deleting enrollment in service:', error)
      if (error.message === 'Enrollment not found') {
        throw error
      }
      throw new Error('Failed to delete enrollment')
    }
  }
}

export default EnrollmentService
>>>>>>> 627466f638de697919d077ca56524377d406840d

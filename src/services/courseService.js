import { Course, User, Group } from '../models/index.js'
import { log } from '../utils/logger.js'

/**
 * Service class for managing courses in the AralKademy application.
 *
 * This service handles all operations related to courses, including:
 * - Retrieving courses (all courses or by ID)
 * - Creating new courses
 * - Updating existing courses
 * - Deleting courses (soft delete and permanent delete)
 * - Assigning teachers to courses
 * - Assigning learner groups to courses
 * - Assigning student-teacher groups to courses
 *
 * The service interacts with the course, user, and group models to perform database operations
 * and maintain relationships between these entities.
 *
 * @class
 * @requires log - A logging utility for error reporting
 * @example
 * // Create a new course service instance
 * const courseService = new CourseService(CourseModel, UserModel, GroupModel);
 *
 * // Get all courses
 * const courses = await courseService.getAllCourses();
 *
 * // Create a new course
 * const newCourse = await courseService.createCourse({
 *   name: 'Introduction to Programming',
 *   description: 'Learn the basics of programming',
 *   user_id: 123, // Teacher ID
 *   learner_group_id: 456,
 *   student_teacher_group_id: 789
 * });
 */
class CourseService {
  /**
   * Creates an instance of the course service.
   *
   * @param {Object} courseModel - The model representing courses.
   * @param {Object} userModel - The model representing users.
   * @param {Object} groupModel - The model representing groups.
   */
  constructor(courseModel, userModel, groupModel) {
    this.courseModel = courseModel
    this.userModel = userModel
    this.groupModel = groupModel
  }

  /**
   * Retrieves all courses with complete associated data including teacher and groups information.
   *
   * This asynchronous function fetches all courses from the database along with their associated
   * teacher, learner group, and student teacher group details. If an error occurs during the
   * retrieval, an error is logged and an exception is thrown.
   *
   * @async
   * @function getAllCourses
   * @returns {Promise<{count: number, rows: Array<Object>}>} A promise that resolves to an object containing:
   *   - count: The total number of courses.
   *   - rows: An array of course objects including their associated teacher and group data.
   * @throws {Error} If the courses cannot be retrieved due to a database error.
   */
  async getAllCourses() {
    try {
      // Include associated models for complete data
      const { count, rows } = await this.courseModel.findAndCountAll({
        include: [
          {
            model: this.userModel,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          { model: this.groupModel, as: 'learnerGroup', attributes: ['group_id', 'name'] },
          { model: this.groupModel, as: 'studentTeacherGroup', attributes: ['group_id', 'name'] },
        ],
      })
      return { count, rows }
    } catch (error) {
      log.error('Error getting all courses:', error)
      throw new Error('Failed to retrieve courses')
    }
  }

  /**
   * Retrieves a course by its ID with associated teacher and group information
   *
   * @async
   * @param {number|string} id - The unique identifier of the course to retrieve
   * @returns {Promise<Object>} The course object with its associated teacher and groups
   * @throws {Error} When the course is not found or when there's a database error
   *
   * @example
   * // Get course with ID 123
   * const course = await courseService.getCourseById(123);
   */
  async getCourseById(id) {
    try {
      const course = await this.courseModel.findByPk(id, {
        include: [
          {
            model: this.userModel,
            as: 'teacher',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          { model: this.groupModel, as: 'learnerGroup', attributes: ['group_id', 'name'] },
          { model: this.groupModel, as: 'studentTeacherGroup', attributes: ['group_id', 'name'] },
        ],
      })
      if (!course) {
        throw new Error('Course not found')
      }
      return course
    } catch (error) {
      log.error(`Error getting course by ID ${id}:`, error)

      // Re-throw "Course not found" error as is
      if (error.message === 'Course not found') {
        throw error
      }

      throw new Error('Failed to fetch course')
    }
  }

  /**
   * Creates a new course with the specified properties
   *
   * @async
   * @param {Object} options - The course creation options
   * @param {string} options.name - The name of the course (required, max 255 chars)
   * @param {string} [options.description] - The description of the course
   * @param {number|null} [options.user_id] - The ID of the user associated with the course
   * @param {number|null} [options.learner_group_id] - The ID of the learner group associated with the course
   * @param {number|null} [options.student_teacher_group_id] - The ID of the student-teacher group associated with the course
   * @returns {Promise<Object>} The newly created course
   * @throws {Error} When course name is not provided or exceeds 255 characters
   * @throws {Error} When course name already exists (unique constraint violation)
   * @throws {Error} When validation fails or other errors occur during creation
   */
  async createCourse({ name, description, user_id, learner_group_id, student_teacher_group_id }) {
    try {
      // Create course data object
      const courseData = {
        name,
        description: description || null,
        user_id: user_id || null,
        learner_group_id: learner_group_id || null,
        student_teacher_group_id: student_teacher_group_id || null,
      }

      // Validate data
      if (!name) {
        throw new Error('Course name is required')
      }

      if (name.length > 255) {
        throw new Error('Course name is too long')
      }

      const newCourse = await this.courseModel.create(courseData)
      return newCourse
    } catch (error) {
      log.error('Error creating course:', error)
      // Re-throw validation errors
      if (
        error.message === 'Course name is required' ||
        error.message === 'Course name is too long'
      ) {
        throw error // Re-throw these specific validation errors
      }

      // Handle Sequelize validation errors
      if (error.name === 'SequelizeValidationError') {
        throw error // Re-throw validation errors for controller to handle
      }

      // Handle unique constraint violation (course name)
      if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].path === 'name') {
        throw new Error('Course name already exists') // Specific, user-friendly error
      }

      throw new Error('Failed to create course') // Generic error for other issues
    }
  }

  async editCourse(courseId, name, description) {
    try {
      // Validate inputs first
      if (!name) {
        throw new Error('Course name is required')
      }

      if (name.length > 255) {
        throw new Error('Course name is too long')
      }

      const course = await this.courseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      // Update course properties
      course.name = name
      course.description = description

      await course.save()
      return course
    } catch (error) {
      log.error(`Error editing course with ID ${courseId}:`, error)
      if (
        error.message === 'Course not found' ||
        error.message === 'Course name is required' ||
        error.message === 'Course name is too long'
      ) {
        throw error // Re-throw these specific errors
      }
      throw new Error('Failed to edit course')
    }
  }

  /**
   * Updates an existing course with the provided data
   * @async
   * @param {number|string} id - The ID of the course to update
   * @param {Object} updatedData - The data to update the course with
   * @returns {Promise<Object>} The updated course object
   * @throws {Error} When the course is not found
   * @throws {Error} When a course with the same name already exists
   * @throws {Error} When validation fails
   * @throws {Error} When the update operation fails for other reasons
   */
  async updateCourse(id, updatedData) {
    try {
      const course = await this.courseModel.findByPk(id)
      if (!course) {
        throw new Error('Course not found')
      }

      const updatedCourse = await course.update(updatedData)
      return updatedCourse
    } catch (error) {
      log.error(`Error updating course with ID ${id}:`, error)

      if (error.message === 'Course not found') {
        throw error
      }

      if (error.name === 'SequelizeValidationError') {
        throw error // Re-throw for controller
      }

      if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].path === 'name') {
        throw new Error('Course name already exists')
      }

      throw new Error('Failed to update course')
    }
  }

  /**
   * Performs a soft deletion of a course by its ID.
   * Soft deletion marks the record as deleted in the database without actually removing it.
   *
   * @async
   * @param {number|string} id - The unique identifier of the course to delete
   * @returns {Promise<Object>} A promise that resolves to an object with a success message
   * @throws {Error} Throws an error if the course is not found or if the deletion fails
   */
  async softDeleteCourse(id) {
    try {
      const course = await this.courseModel.findByPk(id)
      if (!course) {
        throw new Error('Course not found')
      }
      await course.destroy() // Soft delete (paranoid: true)
      return { message: 'Course deleted successfully' }
    } catch (error) {
      log.error(`Error soft-deleting course with ID ${id}:`, error)

      // Re-throw specific validation errors
      if (error.message === 'Course not found') {
        throw error
      }

      // Wrap all other errors with a generic message
      throw new Error('Failed to soft delete course')
    }
  }

  /**
   * Permanently deletes a course from the database by its ID
   * @async
   * @param {number|string} id - The ID of the course to delete
   * @returns {Promise<Object>} A message confirming the course was permanently deleted
   * @throws {Error} When the course with the specified ID is not found
   * @throws {Error} When the deletion fails for any other reason
   */
  async deleteCourse(id) {
    try {
      const course = await this.courseModel.findByPk(id, { paranoid: false }) // Find even if soft-deleted
      if (!course) {
        throw new Error('Course not found')
      }
      await course.destroy({ force: true }) // Permanent delete
      return { message: 'Course permanently deleted' }
    } catch (error) {
      log.error(`Error deleting course with ID ${id}:`, error)

      // Re-throw specific validation errors
      if (error.message === 'Course not found') {
        throw error
      }

      // Wrap all other errors with a generic message
      throw new Error('Failed to permanently delete course')
    }
  }

  /**
   * Assigns a teacher to a specific course.
   *
   * @async
   * @param {number|string} courseId - The ID of the course to assign a teacher to
   * @param {number|string} userId - The ID of the teacher user
   * @returns {Promise<Object>} The updated course object with the teacher assigned
   * @throws {Error} When the course is not found
   * @throws {Error} When the teacher is not found
   * @throws {Error} When the provided user is not a teacher
   * @throws {Error} When assignment fails for other reasons
   */
  async assignTeacherCourse(courseId, userId) {
    try {
      const course = await this.courseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      const teacher = await this.userModel.findByPk(userId)
      if (!teacher) {
        throw new Error('Teacher not found')
      }
      if (teacher.role !== 'teacher') {
        throw new Error('Provided user ID is not a teacher.')
      }

      course.user_id = userId
      await course.save()
      return course
    } catch (error) {
      log.error(
        `Error assigning teacher to course. Course ID: ${courseId}, User ID: ${userId}`,
        error
      )

      // Re-throw specific validation errors
      if (
        error.message === 'Course not found' ||
        error.message === 'Teacher not found' ||
        error.message === 'Provided user ID is not a teacher.'
      ) {
        throw error
      }

      // Wrap all other errors with a generic message
      throw new Error('Failed to assign teacher to course')
    }
  }

  /**
   * Assigns a learner group to a course
   * @async
   * @param {number|string} courseId - The ID of the course to assign
   * @param {number|string} learnerGroupId - The ID of the learner group to assign to the course
   * @returns {Promise<Object>} The updated course object
   * @throws {Error} When course is not found
   * @throws {Error} When learner group is not found
   * @throws {Error} When group type is not 'learner'
   * @throws {Error} When assignment fails for any other reason
   */
  async assignLearnerGroupCourse(courseId, learnerGroupId) {
    try {
      const course = await this.courseModel.findByPk(courseId)

      if (!course) {
        throw new Error('Course not found')
      }
      const learnerGroup = await this.groupModel.findByPk(learnerGroupId)
      if (!learnerGroup) {
        throw new Error('Learner Group not found')
      }
      if (learnerGroup.group_type !== 'learner') {
        throw new Error('Invalid group type. Expected type is learner')
      }

      course.learner_group_id = learnerGroupId
      await course.save()
      return course
    } catch (error) {
      log.error('Error assigning learner group to course:', error)

      // Re-throw specific validation errors
      if (
        error.message === 'Course not found' ||
        error.message === 'Learner Group not found' ||
        error.message === 'Invalid group type. Expected type is learner'
      ) {
        throw error
      }

      // Wrap all other errors with a generic message
      throw new Error('Failed to assign learner group to course')
    }
  }

  /**
   * Assigns a student-teacher group to a course.
   *
   * @async
   * @param {number|string} courseId - The ID of the course to assign the group to.
   * @param {number|string} studentTeacherGroupId - The ID of the student-teacher group to assign.
   * @returns {Promise<Object>} The updated course object with the assigned student-teacher group.
   * @throws {Error} Throws an error if the course is not found.
   * @throws {Error} Throws an error if the student-teacher group is not found.
   * @throws {Error} Throws an error if the group type is not 'student_teacher'.
   */
  async assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId) {
    try {
      const course = await this.courseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }
      const studentTeacherGroup = await this.groupModel.findByPk(studentTeacherGroupId)
      if (!studentTeacherGroup) {
        throw new Error('Student Teacher Group not found')
      }
      if (studentTeacherGroup.group_type !== 'student_teacher') {
        throw new Error('Invalid group type. Expected type is student_teacher')
      }

      course.student_teacher_group_id = studentTeacherGroupId // Use `course.setStudentTeacherGroup()`
      await course.save()
      return course
    } catch (error) {
      log.error('Error assigning student teacher group to course:', error)
      throw error
    }
  }
}

export default CourseService

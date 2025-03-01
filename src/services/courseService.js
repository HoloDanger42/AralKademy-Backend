import { Course, User, Group } from '../models/index.js'
import { log } from '../utils/logger.js'

class CourseService {
  constructor(courseModel, userModel, groupModel) {
    this.courseModel = courseModel
    this.userModel = userModel
    this.groupModel = groupModel
  }

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
      if (error.name === 'SequelizeValidationError') {
        throw error // Re-throw for controller
      }
      if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].path === 'name') {
        throw new Error('Course name already exists')
      }
      throw new Error('Failed to update course')
    }
  }

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

  // Add assign teacher
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

  // Add assign learner group
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

  // Add assign student teacher group
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

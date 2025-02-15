class CourseService {
  constructor(CourseModel, TeacherModel) {
    this.CourseModel = CourseModel
    this.TeacherModel = TeacherModel
  }

  async getAllCourses() {
    try {
      const courses = await this.CourseModel.findAndCountAll()
      return {
        count: courses.count,
        rows: courses.rows,
      }
    } catch (error) {
      throw new Error('Failed to fetch courses')
    }
  }

  async getCourseById(courseId) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }
      return course
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to fetch course')
    }
  }

  async createCourse(
    name,
    description,
    userId,
    studentTeacherGroupId = null,
    learnerGroupId = null
  ) {
    try {
      // Create a ValidationError class for better error handling
      class ValidationError extends Error {
        constructor(message) {
          super(message)
          this.name = 'ValidationError'
        }
      }

      // Validate required fields first
      if (!userId) {
        throw new ValidationError('Teacher ID is required')
      }

      if (!name || name.trim() === '') {
        throw new ValidationError('Course name is required')
      }

      if (name.length > 255) {
        throw new ValidationError('Course name is too long')
      }

      // Verify teacher exists
      const teacher = await this.TeacherModel.findOne({
        where: { user_id: userId },
      })

      if (!teacher) {
        throw new ValidationError(`Teacher not found with ID: ${userId}`)
      }

      // Create course
      const course = await this.CourseModel.create({
        name,
        description,
        user_id: userId,
        student_teacher_group_id: studentTeacherGroupId,
        learner_group_id: learnerGroupId,
      })

      return course
    } catch (error) {
      if (error.name === 'ValidationError') {
        // Re-throw validation errors to be handled by controller
        throw error
      }

      console.error('Course creation failed:', {
        error: error.message,
        name,
        userId,
      })
      throw new Error(`Failed to create course: ${error.message}`)
    }
  }

  async assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      course.student_teacher_group_id = studentTeacherGroupId
      await course.save()

      return course
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to assign student teacher group to course')
    }
  }

  async assignLearnerGroupCourse(courseId, learnerGroupId) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      course.learner_group_id = learnerGroupId
      await course.save()

      return course
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to assign learner group to course')
    }
  }

  async assignTeacherCourse(courseId, userId) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      course.user_id = userId
      await course.save()

      return course
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to assign teacher to course')
    }
  }

  async softDeleteCourse(courseId) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      await course.destroy()

      return { message: 'Course marked as deleted' }
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to soft delete course')
    }
  }

  async editCourse(courseId, name, description) {
    if (!name || name.trim() === '') {
      throw new Error('Course name is required')
    }

    if (name.length > 255) {
      throw new Error('Course name is too long')
    }

    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      course.name = name
      course.description = description
      await course.save()

      return course
    } catch (error) {
      if (error.message === 'Course not found') {
        throw error
      }
      throw new Error('Failed to edit course')
    }
  }
}

export default CourseService

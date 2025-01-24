class CourseService {
  constructor(courseModel) {
    this.CourseModel = courseModel
  }

  async getAllCourses() {
    return await this.CourseModel.findAll()
  }

  async createCourse(name, description) {
    if (!name || name.trim() === '') {
      throw new Error('Course name is required')
    }

    if (name.length > 255) {
      throw new Error('Course name is too long')
    }

    return await this.CourseModel.create({ name, description })
  }

  async assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId) {
    const course = await this.CourseModel.findByPk(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    course.student_teacher_group_id = studentTeacherGroupId
    await course.save()

    return course
  }

  async assignLearnerGroupCourse(courseId, learnerGroupId) {
    const course = await this.CourseModel.findByPk(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    course.learner_group_id = learnerGroupId
    await course.save()

    return course
  }

  async assignTeacherCourse(courseId, userId) {
    const course = await this.CourseModel.findByPk(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    course.user_id = userId
    await course.save()

    return course
  }
}

export default CourseService

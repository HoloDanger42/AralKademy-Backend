class CourseService {
  constructor(courseModel) {
    this.CourseModel = courseModel
  }

  async getAllCourses() {
    return await this.CourseModel.findAll()
  }

  async createCourse(name, description, user_id, learner_group_id, student_teacher_group_id) {
    if (!name || name.trim() === '') {
      throw new Error('Course name is required')
    }

    if (name.length > 255) {
      throw new Error('Course name is too long')
    }

    return await this.CourseModel.create({
      name,
      description,
      user_id,
      learner_group_id,
      student_teacher_group_id,
    })
  }
}

export default CourseService

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
}

export default CourseService

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

    if (!description) {
      throw new Error('Course description is required')
    }

    return await this.CourseModel.create({ name, description })
  }
}

export default CourseService

import { Course } from "../models/Course.js";

class CourseService {
  async getAllCourses() {
    return await Course.findAll();
  }

  async createCourse(name, description) {
    if (!name || name.trim() === "") {
      throw new Error("Course name is required");
    }

    if (!description) {
      throw new Error("Course description is required");
    }

    return await Course.create({ name, description });
  }
}

export default new CourseService();

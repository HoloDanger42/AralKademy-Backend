class CourseService {
  constructor(courseModel) {
    this.CourseModel = courseModel;
  }

  async getAllCourses() {
    try {
      return await this.CourseModel.findAll();
    } catch (error) {
      throw new Error('Failed to fetch courses');
    }
  }

  async getCourseById(courseId) {
    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      return course;
    } catch (error) {
      throw new Error('Failed to fetch course');
    }
  }

  async createCourse(name, description, userId = null, studentTeacherGroupId = null, learnerGroupId = null) {
    if (!name || name.trim() === '') {
      throw new Error('Course name is required');
    }

    if (name.length > 255) {
      throw new Error('Course name is too long');
    }

    try {
      return await this.CourseModel.create({ 
        name,
        description,
        user_id: userId,
        student_teacher_group_id: studentTeacherGroupId,
        learner_group_id: learnerGroupId,
      });
    } catch (error) {
      throw new Error('Failed to create course');
    }
  }

  async assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId) {
    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      course.student_teacher_group_id = studentTeacherGroupId;
      await course.save();

      return course;
    } catch (error) {
      throw new Error('Failed to assign student teacher group to course');
    }
  }

  async assignLearnerGroupCourse(courseId, learnerGroupId) {
    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      course.learner_group_id = learnerGroupId;
      await course.save();

      return course;
    } catch (error) {
      throw new Error('Failed to assign learner group to course');
    }
  }

  async assignTeacherCourse(courseId, userId) {
    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      course.user_id = userId;
      await course.save();

      return course;
    } catch (error) {
      throw new Error('Failed to assign teacher to course');
    }
  }

  async softDeleteCourse(courseId) {
    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Soft delete: instead of destroying, we set the `deletedAt` field
      await course.destroy();

      return { message: 'Course marked as deleted' };
    } catch (error) {
      throw new Error('Failed to soft delete course');
    }
  }

  async editCourse(courseId, name, description) {
    if (!name || name.trim() === '') {
      throw new Error('Course name is required');
    }

    if (name.length > 255) {
      throw new Error('Course name is too long');
    }

    try {
      const course = await this.CourseModel.findByPk(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      course.name = name;
      course.description = description;
      await course.save();

      return course;
    } catch (error) {
      throw new Error('Failed to edit course');
    }
  }
}

export default CourseService;
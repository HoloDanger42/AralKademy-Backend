  import CourseService from '../services/courseService.js'
  import { Course } from '../models/Course.js'
  import { log } from '../utils/logger.js'

  const courseService = new CourseService(Course)

  const getAllCourses = async (_req, res) => {
    try {
      const courses = await courseService.getAllCourses()
      res.status(200).json(courses)
      log.info('Retrieved all courses')
    } catch (error) {
      log.error('Get all courses error:', error)
      return res.status(500).json({ message: 'Failed to retrieve courses' })
    }
  };

  const createCourse = async (req, res) => {
    try {
      const { name, description, userId, learnerGroupId, studentTeacherGroupId } = req.body;
      const newCourse = await courseService.createCourse(name, description, userId, studentTeacherGroupId, learnerGroupId);

      res.status(201).json({
        message: 'Course created successfully',
        course: newCourse,
      });
      log.info(`Course ${name} was successfully created`);
    } catch (error) {
      log.error('Create course error:', error);

      if (error.message === 'Course name is required') {
        return res.status(400).json({ message: 'Course name is required' });
      }
      if (error.message === 'Course name is too long') {
        return res.status(400).json({ message: 'Course name is too long' });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Course name already exists' });
      }
      return res.status(500).json({ message: 'Error creating course' });
    }
  };

  const assignStudentTeacherGroupCourse = async (req, res) => {
    try {
      const { courseId, studentTeacherGroupId } = req.body;
      const course = await courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId);

      res.status(200).json({
        message: 'Student teacher group assigned to course successfully',
        course,
      });
      log.info(`Student teacher group assigned to course ${courseId}`);
    } catch (error) {
      log.error('Assign student teacher group course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(500).json({ message: 'Error assigning student teacher group to course' });
    }
  };

  const assignLearnerGroupCourse = async (req, res) => {
    try {
      const { courseId, learnerGroupId } = req.body;
      const course = await courseService.assignLearnerGroupCourse(courseId, learnerGroupId);

      res.status(200).json({
        message: 'Learner group assigned to course successfully',
        course,
      });
      log.info(`Learner group assigned to course ${courseId}`);
    } catch (error) {
      log.error('Assign learner group course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(500).json({ message: 'Error assigning learner group to course' });
    }
  };

  const assignTeacherCourse = async (req, res) => {
    try {
      const { courseId, userId } = req.body;
      const course = await courseService.assignTeacherCourse(courseId, userId);

      res.status(200).json({
        message: 'Teacher assigned to course successfully',
        course,
      });
      log.info(`Teacher assigned to course ${courseId}`);
    } catch (error) {
      log.error('Assign teacher course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(500).json({ message: 'Error assigning teacher to course' });
    }
  };

  const getCourseById = async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await courseService.getCourseById(courseId);
      res.status(200).json(course);
    } catch (error) {
      log.error('Get course by ID error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(500).json({ message: 'Error fetching course' });
    }
  };

  const softDeleteCourse = async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await courseService.softDeleteCourse(courseId);
      res.status(200).json({
        message: 'Course deleted successfully',
        course,
      });
      log.info(`Course ${courseId} was successfully deleted`);
    } catch (error) {
      log.error('Soft delete course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      return res.status(500).json({ message: 'Error deleting course' });
    }
  };

  const editCourse = async (req, res) => {
    try {
      const { courseId } = req.params;
      const { name, description } = req.body;
      const course = await courseService.editCourse(courseId, name, description);
      res.status(200).json({
        message: 'Course edited successfully',
        course,
      });
      log.info(`Course ${courseId} was successfully edited`);
    } catch (error) {
      log.error('Edit course error:', error);
      if (error.message === 'Course not found') {
        return res.status(404).json({ message: 'Course not found' });
      }
      if (error.message === 'Course name is required') {
        return res.status(400).json({ message: 'Course name is required' });
      }
      if (error.message === 'Course name is too long') {
        return res.status(400).json({ message: 'Course name is too long' });
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Course name already exists' });
      }
      return res.status(500).json({ message: 'Error editing course' });
    }
  };

  export { getAllCourses, createCourse, assignStudentTeacherGroupCourse, assignLearnerGroupCourse, assignTeacherCourse, getCourseById, softDeleteCourse, editCourse };

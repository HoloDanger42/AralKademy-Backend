import { beforeEach, describe, expect, jest } from '@jest/globals'
import { getAllCourses, createCourse, editCourse, assignLearnerGroupCourse, assignStudentTeacherGroupCourse, assignTeacherCourse, softDeleteCourse, getCourseById } from '../../../src/controllers/courseController.js'
import CourseService from '../../../src/services/courseService.js'
import { log } from '../../../src/utils/logger.js'

describe('Course Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.spyOn(log, 'info');
    jest.spyOn(log, 'error');
    jest.clearAllMocks();
  });

  describe('getAllCourses', () => {
    test('should retrieve all courses successfully (get all courses)' , async () => {
      const courses = [{ id: 1, name: 'Test Course' }];
      jest.spyOn(CourseService.prototype, 'getAllCourses').mockResolvedValue(courses);

      await getAllCourses(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(courses);
      expect(log.info).toHaveBeenCalledWith('Retrieved all courses');
    });

    test('should handle errors (get all courses)', async () => {
      jest.spyOn(CourseService.prototype, 'getAllCourses').mockRejectedValue(new Error('Error fetching courses'));

      await getAllCourses(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve courses' });
      expect(log.error).toHaveBeenCalledWith('Get all courses error:', expect.any(Error));
    });
  });

  describe('createCourse', () => {
    test('should create a new course successfully (create course)', async () => {
      mockReq.body = { name: 'New Course', description: 'Description', userId: 1 };
      const newCourse = { id: 1, name: 'New Course' };
      jest.spyOn(CourseService.prototype, 'createCourse').mockResolvedValue(newCourse);

      await createCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course created successfully',
        course: newCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Course New Course was successfully created');
    });

    test('should handle validation errors (create course)', async () => {
      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(new Error('Course name is required'));

      await createCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name is required' });
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error));
    });

    test('should handle unique constraint errors (create course)', async () => {
      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });

      await createCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name already exists' });
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Object));
    });

    test('should handle when course name is too long (create course)', async () => {
      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(new Error('Course name is too long'));

      await createCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name is too long' });
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error));
    });

    test('should handle error when creating the course (create course)', async () => {
      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(new Error('Error creating course'));

      await createCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error creating course' });
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error));
    });
  });

  describe('assignStudentTeacherGroupCourse', () => {
    test('should assign a student-teacher group to a course (assign student teacher group course)', async () => {
      mockReq.body = { courseId: 1, studentTeacherGroupId: 2 };
      const updatedCourse = { id: 1, studentTeacherGroupId: 2 };
      jest.spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse').mockResolvedValue(updatedCourse);

      await assignStudentTeacherGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Student teacher group assigned to course successfully',
        course: updatedCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Student teacher group assigned to course 1');
    });

    test('should handle when course not found (assign student teacher group course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse').mockRejectedValue(new Error('Course not found'));

      await assignStudentTeacherGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Assign student teacher group course error:', expect.any(Error));
    });

    test('should handle error when assigning the student-teacher group (assign student teacher group course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse').mockRejectedValue(new Error('Error assigning student-teacher group'));

      await assignStudentTeacherGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error assigning student teacher group to course' });
      expect(log.error).toHaveBeenCalledWith('Assign student teacher group course error:', expect.any(Error));
    });
  });

  describe('assignLearnerGroupCourse', () => {
    test('should assign a learner group to a course (assign learner group course)', async () => {
      mockReq.body = { courseId: 1, learnerGroupId: 2 };
      const updatedCourse = { id: 1, learnerGroupId: 2 };
      jest.spyOn(CourseService.prototype, 'assignLearnerGroupCourse').mockResolvedValue(updatedCourse);

      await assignLearnerGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Learner group assigned to course successfully',
        course: updatedCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Learner group assigned to course 1');
    });

    test('should handle when course not found (assign learner group course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignLearnerGroupCourse').mockRejectedValue(new Error('Course not found'));

      await assignLearnerGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Assign learner group course error:', expect.any(Error));
    });

    test('should handle error when assigning the learner group (assign learner group course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignLearnerGroupCourse').mockRejectedValue(new Error('Error assigning learner group'));

      await assignLearnerGroupCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error assigning learner group to course' });
      expect(log.error).toHaveBeenCalledWith('Assign learner group course error:', expect.any(Error));
    });
  });

  describe('assignTeacherCourse', () => {
    test('should assign a teacher to a course (assign teacher course)', async () => {
      mockReq.body = { courseId: 1, userId: 3 };
      const updatedCourse = { id: 1, teacherId: 3 };
      jest.spyOn(CourseService.prototype, 'assignTeacherCourse').mockResolvedValue(updatedCourse);

      await assignTeacherCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Teacher assigned to course successfully',
        course: updatedCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Teacher assigned to course 1');
    });

    test('should handle when course not found (assign teacher course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignTeacherCourse').mockRejectedValue(new Error('Course not found'));

      await assignTeacherCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Assign teacher course error:', expect.any(Error));
    });

    test('should handle error when assigning the teacher (assign teacher course)', async () => {
      jest.spyOn(CourseService.prototype, 'assignTeacherCourse').mockRejectedValue(new Error('Error assigning teacher'));

      await assignTeacherCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error assigning teacher to course' });
      expect(log.error).toHaveBeenCalledWith('Assign teacher course error:', expect.any(Error));
    });
  });

  describe('getCourseById', () => {
    test('should return a course by ID successfully (get course by id)', async () => {
      mockReq.params = { courseId: 1 };
      const course = { id: 1, name: 'Test Course' };
      jest.spyOn(CourseService.prototype, 'getCourseById').mockResolvedValue(course);

      await getCourseById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(course);
    });

    test('should handle when course not found (get course by id)', async () => {
      jest.spyOn(CourseService.prototype, 'getCourseById').mockRejectedValue(new Error('Course not found'));

      await getCourseById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Get course by ID error:', expect.any(Error));
    });

    test('should handle error when fetching the course (get course by id)', async () => {
      jest.spyOn(CourseService.prototype, 'getCourseById').mockRejectedValue(new Error('Error fetching course'));

      await getCourseById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error fetching course' });
      expect(log.error).toHaveBeenCalledWith('Get course by ID error:', expect.any(Error));
    });
  });

  describe('softDeleteCourse', () => {
    test('should soft delete a course successfully (soft delete course)', async () => {
      mockReq.params = { courseId: 1 };
      const deletedCourse = { id: 1, isDeleted: true };
      jest.spyOn(CourseService.prototype, 'softDeleteCourse').mockResolvedValue(deletedCourse);

      await softDeleteCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course deleted successfully',
        course: deletedCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Course 1 was successfully deleted');
    });

    test('should handle when course not found (soft delete course)', async () => {
      jest.spyOn(CourseService.prototype, 'softDeleteCourse').mockRejectedValue(new Error('Course not found'));

      await softDeleteCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Soft delete course error:', expect.any(Error));
    });

    test('should handle error when deleting the course (soft delete course)', async () => {
      jest.spyOn(CourseService.prototype, 'softDeleteCourse').mockRejectedValue(new Error('Error deleting course'));

      await softDeleteCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error deleting course' });
      expect(log.error).toHaveBeenCalledWith('Soft delete course error:', expect.any(Error));
    });
  });

  describe('editCourse', () => {
    test('should edit a course successfully (edit course)', async () => {
      mockReq.params = { courseId: 1 };
      mockReq.body = { name: 'Updated Course', description: 'Updated Description' };
      const updatedCourse = { id: 1, name: 'Updated Course' };
      jest.spyOn(CourseService.prototype, 'editCourse').mockResolvedValue(updatedCourse);

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course edited successfully',
        course: updatedCourse,
      });
      expect(log.info).toHaveBeenCalledWith('Course 1 was successfully edited');
    });

    test('should handle when course not found (edit course)', async () => {
      jest.spyOn(CourseService.prototype, 'editCourse').mockRejectedValue(new Error('Course not found'));

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course not found' });
      expect(log.error).toHaveBeenCalledWith('Edit course error:', expect.any(Error));
    });

    test('should handle course name is required (edit course)', async () => {
      jest.spyOn(CourseService.prototype, 'editCourse').mockRejectedValue(new Error('Course name is required'));

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name is required' });
      expect(log.error).toHaveBeenCalledWith('Edit course error:', expect.any(Error));
    });

    test('should handle course name is too long (edit course)', async () => {
      jest.spyOn(CourseService.prototype, 'editCourse').mockRejectedValue(new Error('Course name is too long'));

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name is too long' });
      expect(log.error).toHaveBeenCalledWith('Edit course error:', expect.any(Error));
    });

    test('should handle error when editing the course (edit course)', async () => {
      jest.spyOn(CourseService.prototype, 'editCourse').mockRejectedValue(new Error('Error editing course'));

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Error editing course' });
      expect(log.error).toHaveBeenCalledWith('Edit course error:', expect.any(Error));
    });

    test('should handle course name already exists (edit course)', async () => {
      jest.spyOn(CourseService.prototype, 'editCourse').mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });

      await editCourse(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name already exists' });
      expect(log.error).toHaveBeenCalledWith('Edit course error:', expect.any(Object));
    });
  });
});
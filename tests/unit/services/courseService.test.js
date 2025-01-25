import { beforeEach, describe, expect, jest } from '@jest/globals'
import CourseService from '../../../src/services/courseService'
import { validCourses, invalidCourses } from '../../fixtures/courseData'

const mockCourseModel = {
  create: jest.fn(),
  findAll: jest.fn(),
}

describe('Course Service', () => {
  let courseService

  beforeEach(() => {
    courseService = new CourseService(mockCourseModel)
    jest.resetAllMocks()
  })

  describe('getAllCourses', () => {
    test('should retrieve all courses', async () => {
      // Arrange
      const expectedCourses = validCourses.map((course, index) => ({
        id: index + 1,
        ...course,
      }))
      mockCourseModel.findAll.mockResolvedValue(expectedCourses)

      // Act
      const courses = await courseService.getAllCourses()

      // Assert
      expect(courses).toEqual(expectedCourses)
      expect(mockCourseModel.findAll).toHaveBeenCalled()
    })

    test('should return empty array when no courses exist', async () => {
      // Arrange
      mockCourseModel.findAll.mockResolvedValue([])

      // Act
      const courses = await courseService.getAllCourses()

      // Assert
      expect(courses).toEqual([])
      expect(mockCourseModel.findAll).toHaveBeenCalled()
    })
  })

  describe('createCourse', () => {
    test('should create a course successfully', async () => {
      // Arrange
      const courseData = validCourses[0];
      const expectedData = {
        ...courseData,
        learner_group_id: null, // Align with the implementation
        student_teacher_group_id: null,
        user_id: null,
      };
      mockCourseModel.create.mockResolvedValue({ id: 1, ...expectedData });

      // Act
      const course = await courseService.createCourse(courseData.name, courseData.description)

      // Assert
      expect(course).toEqual({ id: 1, ...expectedData });
      expect(mockCourseModel.create).toHaveBeenCalledWith(expectedData);
    })

    test('should throw error when course name is empty', async () => {
      // Arrange
      const invalidCourse = invalidCourses[0]

      // Act & Assert
      await expect(courseService.createCourse('', invalidCourse.description)).rejects.toThrow(
        'Course name is required'
      )
    })

    test('should throw error when course name is too long', async () => {
      // Arrange
      const invalidCourse = invalidCourses[1]

      // Act & Assert
      await expect(
        courseService.createCourse(invalidCourse.name, invalidCourse.description)
      ).rejects.toThrow('Course name is too long')
    })
  })
  describe('getCourseById', () => {
    test('should return the course when it exists', async () => {
      // Arrange
      const courseId = 1;
      const expectedCourse = { id: courseId, name: 'Test Course' };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(expectedCourse);
  
      // Act
      const course = await courseService.getCourseById(courseId);
  
      // Assert
      expect(course).toEqual(expectedCourse);
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error when the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.getCourseById(courseId)).rejects.toThrow('Failed to fetch course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error when the query fails', async () => {
      // Arrange
      const courseId = 1;
      mockCourseModel.findByPk = jest.fn().mockRejectedValue(new Error('Database error'));
  
      // Act & Assert
      await expect(courseService.getCourseById(courseId)).rejects.toThrow('Failed to fetch course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  });
  describe('assignStudentTeacherGroupCourse', () => {
    test('should successfully assign student teacher group to a course', async () => {
      // Arrange
      const courseId = 1;
      const studentTeacherGroupId = 101;
      const course = { id: courseId, save: jest.fn() };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act
      const updatedCourse = await courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId);
  
      // Assert
      expect(course.student_teacher_group_id).toBe(studentTeacherGroupId);
      expect(course.save).toHaveBeenCalled();
      expect(updatedCourse).toEqual(course);
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      const studentTeacherGroupId = 101;
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)).rejects.toThrow('Failed to assign student teacher group to course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if saving the course fails', async () => {
      // Arrange
      const courseId = 1;
      const studentTeacherGroupId = 101;
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Save error')) };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act & Assert
      await expect(courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)).rejects.toThrow('Failed to assign student teacher group to course');
      expect(course.save).toHaveBeenCalled();
    });
  });
  describe('assignLearnerGroupCourse', () => {
    test('should successfully assign learner group to a course', async () => {
      // Arrange
      const courseId = 1;
      const learnerGroupId = 101;
      const course = { id: courseId, save: jest.fn() };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act
      const updatedCourse = await courseService.assignLearnerGroupCourse(courseId, learnerGroupId);
  
      // Assert
      expect(course.learner_group_id).toBe(learnerGroupId);
      expect(course.save).toHaveBeenCalled();
      expect(updatedCourse).toEqual(course);
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      const learnerGroupId = 101;
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.assignLearnerGroupCourse(courseId, learnerGroupId)).rejects.toThrow('Failed to assign learner group to course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if saving the course fails', async () => {
      // Arrange
      const courseId = 1;
      const learnerGroupId = 101;
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Save error')) };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act & Assert
      await expect(courseService.assignLearnerGroupCourse(courseId, learnerGroupId)).rejects.toThrow('Failed to assign learner group to course');
      expect(course.save).toHaveBeenCalled();
    });
  });
  describe('assignTeacherCourse', () => {
    test('should successfully assign teacher to a course', async () => {
      // Arrange
      const courseId = 1;
      const userId = 101;
      const course = { id: courseId, save: jest.fn() };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act
      const updatedCourse = await courseService.assignTeacherCourse(courseId, userId);
  
      // Assert
      expect(course.user_id).toBe(userId);
      expect(course.save).toHaveBeenCalled();
      expect(updatedCourse).toEqual(course);
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      const userId = 101;
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow('Failed to assign teacher to course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if saving the course fails', async () => {
      // Arrange
      const courseId = 1;
      const userId = 101;
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Save error')) };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow('Failed to assign teacher to course');
      expect(course.save).toHaveBeenCalled();
    });
  });
})

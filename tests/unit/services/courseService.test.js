import { beforeEach, describe, expect, jest } from '@jest/globals'
import CourseService from '../../../src/services/courseService'
import { validCourses, invalidCourses } from '../../fixtures/courseData'

describe('Course Service', () => {
  let courseService
  let mockCourseModel

  beforeEach(() => {
    mockCourseModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }
    courseService = new CourseService(mockCourseModel)
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
      const course = await courseService.createCourse(
        courseData.name,
        courseData.description,
        courseData.user_id,
        courseData.learner_group_id,
        courseData.student_teacher_group_id
      )

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

  describe('softDeleteCourse', () => {
    test('should successfully soft delete a course', async () => {
      // Arrange
      const courseId = 1;
      const course = { id: courseId, destroy: jest.fn() };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act
      await courseService.softDeleteCourse(courseId);
  
      // Assert
      expect(course.destroy).toHaveBeenCalled();
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.softDeleteCourse(courseId)).rejects.toThrow('Failed to soft delete course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if deleting the course fails', async () => {
      // Arrange
      const courseId = 1;
      const course = { id: courseId, destroy: jest.fn().mockRejectedValue(new Error('Delete error')) };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act & Assert
      await expect(courseService.softDeleteCourse(courseId)).rejects.toThrow('Failed to soft delete course');
      expect(course.destroy).toHaveBeenCalled();
    });
  });

  describe('editCourse', () => {
    test('should successfully edit a course', async () => {
      // Arrange
      const courseId = 1;
      const name = 'New Course Name';
      const description = 'New Course Description';
      const course = { id: courseId, save: jest.fn() };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act
      const updatedCourse = await courseService.editCourse(courseId, name, description);
  
      // Assert
      expect(course.name).toBe(name);
      expect(course.description).toBe(description);
      expect(course.save).toHaveBeenCalled();
      expect(updatedCourse).toEqual(course);
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1;
      const name = 'New Course Name';
      const description = 'New Course Description';
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null);
  
      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow('Failed to edit course');
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId);
    });
  
    test('should throw an error if saving the course fails', async () => {
      // Arrange
      const courseId = 1;
      const name = 'New Course Name';
      const description = 'New Course Description';
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Save error')) };
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course);
  
      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow('Failed to edit course');
      expect(course.save).toHaveBeenCalled();
    });

    test('should throw an error if the course name is empty', async () => {
      // Arrange
      const courseId = 1;
      const name = '';
      const description = 'New Course Description';
      mockCourseModel.findByPk = jest.fn().mockResolvedValue({ id: courseId });
  
      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow('Course name is required');
      expect(mockCourseModel.findByPk).not.toHaveBeenCalled();
    });

    test('should throw an error if the course name is too long', async () => {
      // Arrange
      const courseId = 1;
      const name = 'a'.repeat(256);
      const description = 'New Course Description';
      mockCourseModel.findByPk = jest.fn().mockResolvedValue({ id: courseId });
  
      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow('Course name is too long');
      expect(mockCourseModel.findByPk).not.toHaveBeenCalled();
    });
  });
})

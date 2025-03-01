import { beforeEach, describe, expect, jest } from '@jest/globals'
import CourseService from '../../../src/services/courseService'
import { validCourses, invalidCourses } from '../../fixtures/courseData'

describe('Course Service', () => {
  let courseService
  let mockCourseModel
  let mockUserModel
  let mockGroupModel

  beforeEach(() => {
    mockCourseModel = {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }

    mockUserModel = {
      findByPk: jest.fn(),
    }

    mockGroupModel = {
      findByPk: jest.fn(),
    }
    courseService = new CourseService(mockCourseModel, mockUserModel, mockGroupModel)
  })

  describe('getAllCourses', () => {
    test('should retrieve all courses (get all courses)', async () => {
      // Arrange
      const expectedCourses = validCourses.map((course, index) => ({
        id: index + 1,
        ...course,
      }))
      mockCourseModel.findAndCountAll = jest.fn().mockResolvedValue({
        count: expectedCourses.length,
        rows: expectedCourses,
      })

      // Act
      const result = await courseService.getAllCourses()

      // Assert
      expect(result).toEqual({
        count: expectedCourses.length,
        rows: expectedCourses,
      })
      expect(mockCourseModel.findAndCountAll).toHaveBeenCalled()
    })

    test('should throw an error when the query fails (get all courses)', async () => {
      // Arrange
      mockCourseModel.findAndCountAll.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(courseService.getAllCourses()).rejects.toThrow('Failed to retrieve courses')
      expect(mockCourseModel.findAndCountAll).toHaveBeenCalled()
    })
  })

  describe('createCourse', () => {
    test('should create a course successfully (create course)', async () => {
      // Arrange
      const courseData = validCourses[0]
      const expectedData = {
        ...courseData,
        learner_group_id: null,
        student_teacher_group_id: null,
        user_id: null,
      }

      mockCourseModel.create.mockResolvedValue({ id: 1, ...expectedData })

      // Act
      const course = await courseService.createCourse(
        courseData.name,
        courseData.description,
        courseData.user_id,
        courseData.learner_group_id,
        courseData.student_teacher_group_id
      )

      // Assert
      expect(course).toEqual({ id: 1, ...expectedData })
      expect(mockCourseModel.create).toHaveBeenCalledWith(expectedData)
    })

    test('should throw error when course name is empty (create course)', async () => {
      // Arrange
      const invalidCourse = invalidCourses[0]

      // Act & Assert
      await expect(courseService.createCourse('', invalidCourse.description)).rejects.toThrow(
        'Course name is required'
      )
    })

    test('should throw error when course name is too long (create course)', async () => {
      // Arrange
      const invalidCourse = invalidCourses[1]

      // Act & Assert
      await expect(
        courseService.createCourse(invalidCourse.name, invalidCourse.description)
      ).rejects.toThrow('Course name is too long')
    })

    test('should throw error when course creation fails (create course)', async () => {
      // Arrange
      const courseData = validCourses[0]

      // Mock course creation failure
      mockCourseModel.create.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(
        courseService.createCourse(courseData.name, courseData.description)
      ).rejects.toThrow('Failed to create course')
    })
  })

  describe('getCourseById', () => {
    test('should return the course when it exists (get course by id)', async () => {
      // Arrange
      const courseId = 1
      const expectedCourse = { id: courseId, name: 'Test Course' }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(expectedCourse)

      // Act
      const course = await courseService.getCourseById(courseId)

      // Assert
      expect(course).toEqual(expectedCourse)

      // Verify the first argument is correct (courseId)
      expect(mockCourseModel.findByPk.mock.calls[0][0]).toBe(courseId)

      // Optionally verify include is present
      expect(mockCourseModel.findByPk.mock.calls[0][1]).toHaveProperty('include')
    })

    test('should throw an error when the course does not exist (get course by id)', async () => {
      // Arrange
      const courseId = 1
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.getCourseById(courseId)).rejects.toThrow('Course not found')

      // Verify the first argument is correct (courseId)
      expect(mockCourseModel.findByPk.mock.calls[0][0]).toBe(courseId)

      // Optionally verify include is present
      expect(mockCourseModel.findByPk.mock.calls[0][1]).toHaveProperty('include')
    })

    test('should throw an error when the query fails (get course by id)', async () => {
      // Arrange
      const courseId = 1
      mockCourseModel.findByPk = jest.fn().mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(courseService.getCourseById(courseId)).rejects.toThrow('Failed to fetch course')

      // Verify the first argument is correct (courseId)
      expect(mockCourseModel.findByPk.mock.calls[0][0]).toBe(courseId)

      // Optionally verify include is present
      expect(mockCourseModel.findByPk.mock.calls[0][1]).toHaveProperty('include')
    })
  })

  describe('assignStudentTeacherGroupCourse', () => {
    test('should successfully assign student teacher group to a course (assign student teacher group course)', async () => {
      // Arrange
      const courseId = 1
      const studentTeacherGroupId = 101
      const course = { id: courseId, save: jest.fn() }
      const group = { id: studentTeacherGroupId, group_type: 'student_teacher' }

      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)
      mockGroupModel.findByPk = jest.fn().mockResolvedValue(group)

      // Act
      const updatedCourse = await courseService.assignStudentTeacherGroupCourse(
        courseId,
        studentTeacherGroupId
      )

      // Assert
      expect(course.student_teacher_group_id).toBe(studentTeacherGroupId)
      expect(course.save).toHaveBeenCalled()
      expect(updatedCourse).toEqual(course)
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
      expect(mockGroupModel.findByPk).toHaveBeenCalledWith(studentTeacherGroupId)
    })

    test('should throw an error if the course does not exist (assign student teacher group course)', async () => {
      // Arrange
      const courseId = 1
      const studentTeacherGroupId = 101
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(
        courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)
      ).rejects.toThrow('Course not found')
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if assigning fails (assign student teacher group course)', async () => {
      // Arrange
      const courseId = 1
      const studentTeacherGroupId = 101

      // Mock successful course lookup
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Assign error')) }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Mock successful group lookup
      const group = { id: studentTeacherGroupId, group_type: 'student_teacher' }
      mockGroupModel.findByPk = jest.fn().mockResolvedValue(group)

      // Act & Assert
      await expect(
        courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)
      ).rejects.toThrow('Assign error') // Now expecting the actual error message

      expect(course.save).toHaveBeenCalled()
    })
  })

  describe('assignLearnerGroupCourse', () => {
    test('should successfully assign learner group to a course (assign learner group course)', async () => {
      // Arrange
      const courseId = 1
      const learnerGroupId = 101
      const course = { id: courseId, save: jest.fn() }
      const group = { id: learnerGroupId, group_type: 'learner' }

      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)
      mockGroupModel.findByPk = jest.fn().mockResolvedValue(group)

      // Act
      const updatedCourse = await courseService.assignLearnerGroupCourse(courseId, learnerGroupId)

      // Assert
      expect(course.learner_group_id).toBe(learnerGroupId)
      expect(course.save).toHaveBeenCalled()
      expect(updatedCourse).toEqual(course)
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if the course does not exist (assign learner group course)', async () => {
      // Arrange
      const courseId = 1
      const learnerGroupId = 101
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(
        courseService.assignLearnerGroupCourse(courseId, learnerGroupId)
      ).rejects.toThrow('Course not found')
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if assigning fails (assign learner group course)', async () => {
      // Arrange
      const courseId = 1
      const learnerGroupId = 101
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Assign error')) }
      const group = { id: learnerGroupId, group_type: 'learner' }

      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)
      mockGroupModel.findByPk = jest.fn().mockResolvedValue(group)

      // Act & Assert
      await expect(
        courseService.assignLearnerGroupCourse(courseId, learnerGroupId)
      ).rejects.toThrow('Failed to assign learner group to course')
      expect(course.save).toHaveBeenCalled()
    })
  })

  describe('assignTeacherCourse', () => {
    test('should successfully assign teacher to a course (assign teacher course)', async () => {
      // Arrange
      const courseId = 1
      const userId = 101
      const course = { id: courseId, save: jest.fn() }
      const teacher = { id: userId, role: 'teacher' }

      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)
      mockUserModel.findByPk = jest.fn().mockResolvedValue(teacher)

      // Act
      const updatedCourse = await courseService.assignTeacherCourse(courseId, userId)

      // Assert
      expect(course.user_id).toBe(userId)
      expect(course.save).toHaveBeenCalled()
      expect(updatedCourse).toEqual(course)
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(userId)
    })

    test('should throw an error if the course does not exist (assign teacher course)', async () => {
      // Arrange
      const courseId = 1
      const userId = 101
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow(
        'Course not found'
      )
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if assigning fails (assign teacher course)', async () => {
      // Arrange
      const courseId = 1
      const userId = 101
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Assign error')) }
      const teacher = { id: userId, role: 'teacher' }

      mockUserModel.findByPk = jest.fn().mockResolvedValue(teacher)
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow(
        'Failed to assign teacher to course'
      )
      expect(course.save).toHaveBeenCalled()
    })
  })

  describe('softDeleteCourse', () => {
    test('should successfully soft delete a course (soft delete course)', async () => {
      // Arrange
      const courseId = 1
      const course = { id: courseId, destroy: jest.fn() }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act
      await courseService.softDeleteCourse(courseId)

      // Assert
      expect(course.destroy).toHaveBeenCalled()
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if the course does not exist (soft delete course)', async () => {
      // Arrange
      const courseId = 1
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.softDeleteCourse(courseId)).rejects.toThrow('Course not found')
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if deleting the course fails (soft delete course)', async () => {
      // Arrange
      const courseId = 1
      const course = {
        id: courseId,
        destroy: jest.fn().mockRejectedValue(new Error('Delete error')),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act & Assert
      await expect(courseService.softDeleteCourse(courseId)).rejects.toThrow(
        'Failed to soft delete course'
      )
      expect(course.destroy).toHaveBeenCalled()
    })
  })

  describe('editCourse', () => {
    test('should successfully edit a course (edit course)', async () => {
      // Arrange
      const courseId = 1
      const name = 'New Course Name'
      const description = 'New Course Description'
      const course = { id: courseId, save: jest.fn() }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act
      const updatedCourse = await courseService.editCourse(courseId, name, description)

      // Assert
      expect(course.name).toBe(name)
      expect(course.description).toBe(description)
      expect(course.save).toHaveBeenCalled()
      expect(updatedCourse).toEqual(course)
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if the course does not exist (edit course)', async () => {
      // Arrange
      const courseId = 1
      const name = 'New Course Name'
      const description = 'New Course Description'
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow(
        'Course not found'
      )
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if saving the course fails (edit course)', async () => {
      // Arrange
      const courseId = 1
      const name = 'New Course Name'
      const description = 'New Course Description'
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Save error')) }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow(
        'Failed to edit course'
      )
      expect(course.save).toHaveBeenCalled()
    })

    test('should throw an error if the course name is empty (edit course)', async () => {
      // Arrange
      const courseId = 1
      const name = ''
      const description = 'New Course Description'
      mockCourseModel.findByPk = jest.fn().mockResolvedValue({ id: courseId })

      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow(
        'Course name is required'
      )
      expect(mockCourseModel.findByPk).not.toHaveBeenCalled()
    })

    test('should throw an error if the course name is too long (edit course)', async () => {
      // Arrange
      const courseId = 1
      const name = 'a'.repeat(256)
      const description = 'New Course Description'
      mockCourseModel.findByPk = jest.fn().mockResolvedValue({ id: courseId })

      // Act & Assert
      await expect(courseService.editCourse(courseId, name, description)).rejects.toThrow(
        'Course name is too long'
      )
      expect(mockCourseModel.findByPk).not.toHaveBeenCalled()
    })
  })
})

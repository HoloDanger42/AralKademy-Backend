import { beforeEach, describe, expect, jest } from '@jest/globals'
import { getAllCourses, createCourse } from '../../../src/controllers/courseController.js'
import CourseService from '../../../src/services/courseService.js'
import { log } from '../../../src/utils/logger.js'
import { validCourses } from '../../fixtures/courseData.js'

describe('Course Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
    }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.clearAllMocks()
  })

  describe('getAllCourses', () => {
    test('should retrieve all courses successfully', async () => {
      // Arrange
      const mockCourses = validCourses.map((course, index) => ({
        id: index + 1,
        ...course,
      }))
      CourseService.prototype.getAllCourses = jest.fn().mockResolvedValue(mockCourses)

      // Act
      await getAllCourses(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockCourses)
      expect(log.info).toHaveBeenCalledWith('Retrieved all courses')
    })

    test('should handle error when retrieving courses fails', async () => {
      // Arrange
      const error = new Error('Database error')
      CourseService.prototype.getAllCourses = jest.fn().mockRejectedValue(error)

      // Act
      await getAllCourses(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to retrieve courses' })
      expect(log.error).toHaveBeenCalledWith('Get all courses error:', error)
    })
  })

  describe('createCourse', () => {
    test('should create course successfully', async () => {
      // Arrange
      const courseData = validCourses[0]
      mockReq.body = courseData
      const mockCourse = { id: 1, ...courseData }
      CourseService.prototype.createCourse = jest.fn().mockResolvedValue(mockCourse)

      // Act
      await createCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course created successfully',
        course: mockCourse,
      })
      expect(log.info).toHaveBeenCalledWith(`Course ${courseData.name} was successfully created`)
    })

    test('should handle missing course name error', async () => {
      // Arrange\
      mockReq.body = { description: 'Test description' }
      const error = new Error('Course name is required')
      CourseService.prototype.createCourse = jest.fn().mockRejectedValue(error)

      // Act
      await createCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name is required' })
      expect(log.error).toHaveBeenCalledWith('Create course error:', error)
    })

    test('should handle duplicate course error', async () => {
      // Arrange
      mockReq.body = validCourses[0]
      const error = new Error('Duplicate course')
      error.name = 'SequelizeUniqueConstraintError'
      CourseService.prototype.createCourse = jest.fn().mockRejectedValue(error)

      // Act
      await createCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Course name already exists' })
      expect(log.error).toHaveBeenCalledWith('Create course error:', error)
    })
  })
})

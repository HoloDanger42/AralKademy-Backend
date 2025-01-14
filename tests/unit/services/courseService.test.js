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
      const courseData = validCourses[0]
      mockCourseModel.create.mockResolvedValue({ id: 1, ...courseData })

      // Act
      const course = await courseService.createCourse(courseData.name, courseData.description)

      // Assert
      expect(course).toEqual({ id: 1, ...courseData })
      expect(mockCourseModel.create).toHaveBeenCalledWith(courseData)
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
})

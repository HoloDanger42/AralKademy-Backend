import { beforeEach, describe, expect, jest } from '@jest/globals'
import CourseService from '../../../src/services/courseService'

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
      const expectedCourses = [
        { id: 1, name: 'JavaScript Basics', description: 'Learn JS fundamentals' },
        { id: 2, name: 'Python Programming', description: 'Python for beginners' },
      ]
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
      const courseData = {
        name: 'New Course',
        description: 'Course Description',
      }
      mockCourseModel.create.mockResolvedValue({ id: 1, ...courseData })

      // Act
      const course = await courseService.createCourse(courseData.name, courseData.description)

      // Assert
      expect(course).toEqual({ id: 1, ...courseData })
      expect(mockCourseModel.create).toHaveBeenCalledWith(courseData)
    })

    test('should throw error when course name is empty', async () => {
      // Act & Assert
      await expect(courseService.createCourse('', 'Some description')).rejects.toThrow(
        'Course name is required'
      )
      await expect(courseService.createCourse(' ', 'Some description')).rejects.toThrow(
        'Course name is required'
      )
    })
  })
})

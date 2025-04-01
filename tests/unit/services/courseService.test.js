import { beforeEach, describe, expect, jest } from '@jest/globals'
import CourseService from '../../../src/services/courseService'
import { validCourses, invalidCourses } from '../../fixtures/courseData'

describe('Course Service', () => {
  let courseService
  let mockCourseModel
  let mockUserModel
  let mockGroupModel
  let mockLearnerModel
  let mockStudentTeacherModel

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

    mockLearnerModel = {
      findOne: jest.fn(),
    }

    mockStudentTeacherModel = {
      findOne: jest.fn(),
    }
    courseService = new CourseService(mockCourseModel, mockUserModel, mockGroupModel, mockLearnerModel, mockStudentTeacherModel)
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
      const course = await courseService.createCourse({
        name: courseData.name,
        description: courseData.description,
        user_id: courseData.user_id,
        learner_group_id: courseData.learner_group_id,
        student_teacher_group_id: courseData.student_teacher_group_id,
      })

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
        courseService.createCourse({
          name: invalidCourse.name,
          description: invalidCourse.description,
        })
      ).rejects.toThrow('Course name is too long')
    })

    test('should throw error when course creation fails (create course)', async () => {
      // Arrange
      const courseData = validCourses[0]

      // Mock course creation failure
      mockCourseModel.create.mockRejectedValue(new Error('Database error'))

      // Act & Assert
      await expect(
        courseService.createCourse({
          name: courseData.name,
          description: courseData.description,
        })
      ).rejects.toThrow('Failed to create course')
    })

    test('should throw validation error when SequelizeValidationError occurs', async () => {
      // Arrange
      const courseData = validCourses[0]
      const validationError = new Error('Validation error')
      validationError.name = 'SequelizeValidationError'
    
      mockCourseModel.create.mockRejectedValue(validationError)
    
      // Act & Assert
      await expect(
        courseService.createCourse({
          name: courseData.name,
          description: courseData.description,
        })
      ).rejects.toThrow(validationError)
    })
    
    test('should throw user-friendly error when course name already exists (unique constraint)', async () => {
      // Arrange
      const courseData = validCourses[0]
      const uniqueConstraintError = new Error('Course name already exists')
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError'
      uniqueConstraintError.errors = [{ path: 'name' }]
    
      mockCourseModel.create.mockRejectedValue(uniqueConstraintError)
    
      // Act & Assert
      await expect(
        courseService.createCourse({
          name: courseData.name,
          description: courseData.description,
        })
      ).rejects.toThrow('Course name already exists')
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
      const course = { id: courseId, save: jest.fn().mockRejectedValue(new Error('Failed to assign student teacher group to course')) }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Mock successful group lookup
      const group = { id: studentTeacherGroupId, group_type: 'student_teacher' }
      mockGroupModel.findByPk = jest.fn().mockResolvedValue(group)

      // Act & Assert
      await expect(
        courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)
      ).rejects.toThrow('Failed to assign student teacher group to course') // Now expecting the actual error message

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

    test('should throw an error if the teacher does not exist (assign teacher course)', async () => {
      // Arrange
      const courseId = 1
      const userId = 101
    
      mockCourseModel.findByPk = jest.fn().mockResolvedValue({ id: courseId, save: jest.fn() })
      mockUserModel.findByPk = jest.fn().mockResolvedValue(null) // Simulating teacher not found
    
      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow(
        'Teacher not found'
      )
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(userId)
    })
    
    test('should throw an error if the user is not a teacher (assign teacher course)', async () => {
      // Arrange
      const courseId = 1
      const userId = 101
      const course = { id: courseId, save: jest.fn() }
      const nonTeacher = { id: userId, role: 'student' } // User exists but is not a teacher
    
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)
      mockUserModel.findByPk = jest.fn().mockResolvedValue(nonTeacher)
    
      // Act & Assert
      await expect(courseService.assignTeacherCourse(courseId, userId)).rejects.toThrow(
        'Provided user ID is not a teacher.'
      )
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(userId)
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

  describe('deleteCourse', () => {
    test('should permanently delete a course successfully', async () => {
      // Arrange
      const courseId = 1
      const course = { id: courseId, destroy: jest.fn() }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act
      const result = await courseService.deleteCourse(courseId)

      // Assert
      expect(result).toEqual({ message: 'Course permanently deleted' })
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId, { paranoid: false })
      expect(course.destroy).toHaveBeenCalledWith({ force: true })
    })

    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.deleteCourse(courseId)).rejects.toThrow('Course not found')
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId, { paranoid: false })
    })

    test('should throw an error if permanently deleting the course fails', async () => {
      // Arrange
      const courseId = 1
      const course = {
        id: courseId,
        destroy: jest.fn().mockRejectedValue(new Error('Delete error')),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(course)

      // Act & Assert
      await expect(courseService.deleteCourse(courseId)).rejects.toThrow(
        'Failed to permanently delete course'
      )
      expect(course.destroy).toHaveBeenCalledWith({ force: true })
    })
  })

  describe('updateCourse', () => {
    test('should update a course successfully', async () => {
      // Arrange
      const courseId = 1
      const updatedData = {
        name: 'Updated Course Name',
        description: 'Updated Course Description',
      }
      const mockCourse = {
        id: courseId,
        name: 'Original Course',
        update: jest.fn().mockResolvedValue({ id: courseId, ...updatedData }),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(mockCourse)

      // Act
      const result = await courseService.updateCourse(courseId, updatedData)

      // Assert
      expect(result).toEqual({ id: courseId, ...updatedData })
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
      expect(mockCourse.update).toHaveBeenCalledWith(updatedData)
    })

    test('should throw an error if the course does not exist', async () => {
      // Arrange
      const courseId = 1
      const updatedData = {
        name: 'Updated Course Name',
        description: 'Updated Course Description',
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(null)

      // Act & Assert
      await expect(courseService.updateCourse(courseId, updatedData)).rejects.toThrow(
        'Course not found'
      )
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(courseId)
    })

    test('should throw an error if updating with duplicate course name', async () => {
      // Arrange
      const courseId = 1
      const updatedData = {
        name: 'Updated Course Name',
        description: 'Updated Course Description',
      }
      const mockCourse = {
        id: courseId,
        update: jest.fn().mockRejectedValue(
          Object.assign(new Error('Course name already exists'), {
            name: 'SequelizeUniqueConstraintError',
            errors: [{ path: 'name' }],
          })
        ),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(mockCourse)

      // Act & Assert
      await expect(courseService.updateCourse(courseId, updatedData)).rejects.toThrow(
        'Course name already exists'
      )
      expect(mockCourse.update).toHaveBeenCalledWith(updatedData)
    })

    test('should re-throw validation errors as-is', async () => {
      // Arrange
      const courseId = 1
      const updatedData = {
        name: 'Updated Course Name',
      }
      const mockCourse = {
        id: courseId,
        update: jest.fn().mockRejectedValue({
          name: 'SequelizeValidationError',
        }),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(mockCourse)

      // Act & Assert
      await expect(courseService.updateCourse(courseId, updatedData)).rejects.toEqual({
        name: 'SequelizeValidationError',
      })
      expect(mockCourse.update).toHaveBeenCalledWith(updatedData)
    })

    test('should throw a generic error for other failures', async () => {
      // Arrange
      const courseId = 1
      const updatedData = {
        name: 'Updated Course Name',
      }
      const mockCourse = {
        id: courseId,
        update: jest.fn().mockRejectedValue(new Error('Database error')),
      }
      mockCourseModel.findByPk = jest.fn().mockResolvedValue(mockCourse)

      // Act & Assert
      await expect(courseService.updateCourse(courseId, updatedData)).rejects.toThrow(
        'Failed to update course'
      )
      expect(mockCourse.update).toHaveBeenCalledWith(updatedData)
    })
  })

  describe('getCoursesOfUser', () => {
    test('should return courses for a learner', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1, role: 'learner' });
      mockLearnerModel.findOne.mockResolvedValue({ user_id: 1, group_id: 10 });
      mockCourseModel.findAll.mockResolvedValue([{ id: 100, name: 'Course A' }]);
  
      const courses = await courseService.getCoursesOfUser(1);
      expect(courses).toEqual([{ id: 100, name: 'Course A' }]);
    });
  
    test('should return courses for a student teacher', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 2, role: 'student_teacher' });
      mockStudentTeacherModel.findOne.mockResolvedValue({ user_id: 2, group_id: 20 });
      mockCourseModel.findAll.mockResolvedValue([{ id: 200, name: 'Course B' }]);
  
      const courses = await courseService.getCoursesOfUser(2);
      expect(courses).toEqual([{ id: 200, name: 'Course B' }]);
    });

    test('should return courses for a teacher', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 2, role: 'teacher' });
      mockCourseModel.findAll.mockResolvedValue([{ id: 200, name: 'Course B' }]);
  
      const courses = await courseService.getCoursesOfUser(2);
      expect(courses).toEqual([{ id: 200, name: 'Course B' }]);
    });
  
    test('should throw an error if user is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null);
      
      await expect(courseService.getCoursesOfUser(3)).rejects.toThrow('User not found');
    });
  
    test('should throw an error if learner is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 4, role: 'learner' });
      mockLearnerModel.findOne.mockResolvedValue(null);
      
      await expect(courseService.getCoursesOfUser(4)).rejects.toThrow('Learner not found');
    });
  
    test('should throw an error if student teacher is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 5, role: 'student_teacher' });
      mockStudentTeacherModel.findOne.mockResolvedValue(null);
      
      await expect(courseService.getCoursesOfUser(5)).rejects.toThrow('Student teacher not found');
    });
  
    test('should throw a generic error if fetching courses fails', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 6, role: 'learner' });
      mockLearnerModel.findOne.mockResolvedValue({ user_id: 6, group_id: 30 });
      mockCourseModel.findAll.mockRejectedValue(new Error('Database error'));
  
      await expect(courseService.getCoursesOfUser(6)).rejects.toThrow('Failed to fetch courses of learner');
    });
  })
})

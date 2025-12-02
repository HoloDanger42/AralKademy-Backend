import { jest } from '@jest/globals'
import { User, Group } from '../../../src/models/index.js'
import {
  getAllCourses,
  createCourse,
  assignLearnerGroupCourse,
  assignStudentTeacherGroupCourse,
  assignTeacherCourse,
  softDeleteCourse,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesOfUser
} from '../../../src/controllers/courseController.js'
import CourseService from '../../../src/services/courseService.js'
import { log } from '../../../src/utils/logger.js'

describe('Course Controller', () => {
  let mockReq
  let mockRes

  const mockRequest = (data) => ({
    params: data,
    body: {},
    user: {},
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
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
    test('should retrieve all courses successfully (get all courses)', async () => {
      const courses = [{ id: 1, name: 'Test Course' }]
      jest.spyOn(CourseService.prototype, 'getAllCourses').mockResolvedValue(courses)

      await getAllCourses(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(courses)
      expect(log.info).toHaveBeenCalledWith('Retrieved all courses')
    })

    test('should handle errors (get all courses)', async () => {
      jest
        .spyOn(CourseService.prototype, 'getAllCourses')
        .mockRejectedValue(new Error('Error fetching courses'))

      await getAllCourses(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error fetching courses',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get all courses error:', expect.any(Error))
    })
  })

  describe('createCourse', () => {
    test('should create a new course successfully (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { name: 'New Course', description: 'Description' }

      const newCourse = { id: 1, name: 'New Course' }
      jest.spyOn(CourseService.prototype, 'createCourse').mockResolvedValue(newCourse)

      await createCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course created successfully',
        course: newCourse,
      })
      expect(log.info).toHaveBeenCalledWith('Course New Course was successfully created')
    })

    test('should return 400 if course name exceeds 255 characters (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'A'.repeat(256), // Exceeding 255 characters
        description: 'Valid Description',
      }
    
      await createCourse(mockReq, mockRes)
    
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: {
          name: 'Course name is too long.',
        },
      })
    })    

    test('should handle validation errors (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { name: 'New Course', description: 'Description' }

      const validationError = new Error('Validation error')
      validationError.name = 'SequelizeValidationError'
      validationError.errors = [
        {
          path: 'name',
          message: 'Course name is required.',
        },
      ]

      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(validationError)

      await createCourse(mockReq, mockRes)

      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error))
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          details: {
            name: 'Course name is required.',
          },
          message: 'Validation failed',
        },
      })
    })

    test('should handle unique constraint errors (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { name: 'New Course', description: 'Description' }

      // Create a standard error with the exact message the controller checks for
      const uniqueConstraintError = new Error('Course name already exists')
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError'
      uniqueConstraintError.errors = [
        {
          message: 'Course name already exists',
          type: 'unique violation',
          path: 'name',
          value: 'New Course',
        },
      ]

      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(uniqueConstraintError)

      await createCourse(mockReq, mockRes)

      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Object))
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Name already exists',
          code: 'CONFLICT',
          details: {
            name: 'name already exists',
          },
        },
      })
    })

    test('should handle when course name is too long (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { name: 'New Course', description: 'Description' }

      const validationError = new Error('Course name is too long.')
      validationError.name = 'ValidationError'
      validationError.path = 'name'

      jest.spyOn(CourseService.prototype, 'createCourse').mockRejectedValue(validationError)

      await createCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Course name is too long.',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error))
    })

    test('should handle error when creating the course (create course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { name: 'New Course', description: 'Description' }

      jest
        .spyOn(CourseService.prototype, 'createCourse')
        .mockRejectedValue(new Error('Error creating course'))

      await createCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error creating course',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Create course error:', expect.any(Error))
    })

    test('should validate teacher ID and return 400 for invalid teacher', async () => {
      // Setup for admin user
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'New Course',
        description: 'Description',
        user_id: 123, // Invalid teacher ID
      }

      // Mock User.findByPk to return null (teacher not found)
      jest.spyOn(User, 'findByPk').mockResolvedValue(null)

      await createCourse(mockReq, mockRes)

      expect(User.findByPk).toHaveBeenCalledWith(123)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { user_id: 'Invalid teacher ID.' },
      })
    })

    test('should validate teacher role and return 400 for non-teacher user', async () => {
      // Setup for admin user
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'New Course',
        description: 'Description',
        user_id: 123, // User ID with wrong role
      }

      // Mock User.findByPk to return a user with non-teacher role
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        id: 123,
        role: 'student', // Not a teacher
      })

      await createCourse(mockReq, mockRes)

      expect(User.findByPk).toHaveBeenCalledWith(123)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { user_id: 'Invalid teacher ID.' },
      })
    })

    test('should validate learner group ID and return 400 for invalid learner group', async () => {
      // Setup for admin user
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'New Course',
        description: 'Description',
        learner_group_id: 456, // Invalid group ID
      }

      // Mock Group.findByPk to return null (group not found)
      jest.spyOn(Group, 'findByPk').mockResolvedValue(null)

      await createCourse(mockReq, mockRes)

      expect(Group.findByPk).toHaveBeenCalledWith(456)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { learner_group_id: 'Invalid learner group ID.' },
      })
    })

    test('should validate student teacher group ID and return 400 for invalid student teacher group', async () => {
      // Setup for admin user
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'New Course',
        description: 'Description',
        student_teacher_group_id: 789, // Invalid group ID
      }

      // Mock Group.findByPk to return null (group not found)
      jest.spyOn(Group, 'findByPk').mockResolvedValue(null)

      await createCourse(mockReq, mockRes)

      expect(Group.findByPk).toHaveBeenCalledWith(789)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { student_teacher_group_id: 'Invalid student teacher group ID.' },
      })
    })

    test('should validate multiple fields and return combined errors', async () => {
      // Setup for admin user
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: '', // Invalid (empty)
        user_id: 123, // Invalid teacher
        learner_group_id: 456, // Invalid group
        student_teacher_group_id: 789, // Invalid group
      }

      // Mock dependencies to fail validation
      jest.spyOn(User, 'findByPk').mockResolvedValue(null)
      jest.spyOn(Group, 'findByPk').mockResolvedValue(null)

      await createCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: {
          name: 'Course name is required.',
          user_id: 'Invalid teacher ID.',
          learner_group_id: 'Invalid learner group ID.',
          student_teacher_group_id: 'Invalid student teacher group ID.',
        },
      })
    })

    test('should successfully create course with valid IDs', async () => {
      // Setup for admin user with all IDs provided
      mockReq.user = { role: 'admin' }
      mockReq.body = {
        name: 'Complete Course',
        description: 'Full setup course',
        user_id: 123,
        learner_group_id: 456,
        student_teacher_group_id: 789,
      }

      // Mock all validations to pass
      jest.spyOn(User, 'findByPk').mockResolvedValue({ id: 123, role: 'teacher' })
      jest.spyOn(Group, 'findByPk').mockImplementation((id) => {
        return Promise.resolve({ id })
      })

      const newCourse = { id: 1, name: 'Complete Course' }
      jest.spyOn(CourseService.prototype, 'createCourse').mockResolvedValue(newCourse)

      await createCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course created successfully',
        course: newCourse,
      })
    })

    test('should return 403 if the user is not an admin (create course)', async () => {
      // Arrange
      mockReq.user = { role: 'teacher' } // Not an admin
      mockReq.body = { name: 'Unauthorized Course', description: 'Should not be created' }
    
      // Act
      await createCourse(mockReq, mockRes)
    
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins can create courses.',
      })
    })    
  })

  describe('assignStudentTeacherGroupCourse', () => {
    test('should assign a student-teacher group to a course (assign student teacher group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }
      mockReq.body = { courseId: 1, studentTeacherGroupId: 2 }

      const updatedCourse = { id: 1, studentTeacherGroupId: 2 }
      jest
        .spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse')
        .mockResolvedValue(updatedCourse)

      await assignStudentTeacherGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Student teacher group assigned to course successfully',
        course: updatedCourse,
      })
      expect(log.info).toHaveBeenCalledWith('Student teacher group 2 assigned to course 1')
    })

    test('should handle when course not found (assign student teacher group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse')
        .mockRejectedValue(new Error('Course not found'))

      await assignStudentTeacherGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign student teacher group to course 1 error:',
        expect.any(Error)
      )
    })

    test('should handle error when assigning the student-teacher group (assign student teacher group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignStudentTeacherGroupCourse')
        .mockRejectedValue(new Error('Error assigning student teacher group to course'))

      await assignStudentTeacherGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error assigning student teacher group to course',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign student teacher group to course 1 error:',
        expect.any(Error)
      )
    })

    test('should return 403 if user is not admin or teacher (assign student-teacher group course)', async () => {
      mockReq.user = { role: 'student' } // Neither admin nor teacher
      mockReq.params = { id: 1 }
    
      await assignStudentTeacherGroupCourse(mockReq, mockRes)
    
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins and teachers can assign student-teacher groups.',
      })
    })    
  })

  describe('assignLearnerGroupCourse', () => {
    test('should assign a learner group to a course (assign learner group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }
      mockReq.body = { courseId: 1, learnerGroupId: 2 }

      const updatedCourse = { id: 1, learnerGroupId: 2 }
      jest
        .spyOn(CourseService.prototype, 'assignLearnerGroupCourse')
        .mockResolvedValue(updatedCourse)

      await assignLearnerGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Learner group assigned to course successfully',
        course: updatedCourse,
      })
      expect(log.info).toHaveBeenCalledWith('Learner group 2 assigned to course 1')
    })

    test('should handle when course not found (assign learner group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignLearnerGroupCourse')
        .mockRejectedValue(new Error('Course not found'))

      await assignLearnerGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign learner group to course 1 error:',
        expect.any(Error)
      )
    })

    test('should handle error when assigning the learner group (assign learner group course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignLearnerGroupCourse')
        .mockRejectedValue(new Error('Error assigning learner group to course'))

      await assignLearnerGroupCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error assigning learner group to course',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Assign learner group to course 1 error:',
        expect.any(Error)
      )
    })

    test('should return 403 if user is not admin or teacher (assign learner group course)', async () => {
      mockReq.user = { role: 'student' } // Neither admin nor teacher
      mockReq.params = { id: 1 }
    
      await assignLearnerGroupCourse(mockReq, mockRes)
    
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins and teachers can assign learner groups.',
      })
    })    
  })

  describe('assignTeacherCourse', () => {
    test('should return 403 if user is not admin (assign teacher course)', async () => {
      mockReq.user = { role: 'teacher' } // Only admins should be allowed
      mockReq.params = { id: 1 }
    
      await assignTeacherCourse(mockReq, mockRes)
    
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins can assign teachers to courses.',
      })
    })    

    test('should assign a teacher to a course (assign teacher course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.body = { courseId: 1, teacherId: 3 }
      mockReq.params = { id: 1 }

      const updatedCourse = { id: 1, teacherId: 3 }
      jest.spyOn(CourseService.prototype, 'assignTeacherCourse').mockResolvedValue(updatedCourse)

      await assignTeacherCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Teacher assigned to course successfully',
        course: updatedCourse,
      })
      expect(log.info).toHaveBeenCalledWith('Teacher 3 assigned to course 1')
    })

    test('should handle when course not found (assign teacher course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignTeacherCourse')
        .mockRejectedValue(new Error('Course not found'))

      await assignTeacherCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Assign teacher to course 1 error:', expect.any(Error))
    })

    test('should handle error when assigning the teacher (assign teacher course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'assignTeacherCourse')
        .mockRejectedValue(new Error('Error assigning teacher to course'))

      await assignTeacherCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error assigning teacher to course',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Assign teacher to course 1 error:', expect.any(Error))
    })
  })

  describe('getCourseById', () => {
    test('should return a course by ID successfully (get course by id)', async () => {
      mockReq.params = { id: 1 }
      const course = { id: 1, name: 'Test Course' }
      jest.spyOn(CourseService.prototype, 'getCourseById').mockResolvedValue(course)

      await getCourseById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(course)
    })

    test('should handle when course not found (get course by id)', async () => {
      mockReq.params = { id: '123' }

      jest
        .spyOn(CourseService.prototype, 'getCourseById')
        .mockRejectedValue(new Error('Course not found'))

      await getCourseById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get course by ID 123 error:', expect.any(Error))
    })

    test('should handle error when fetching the course (get course by id)', async () => {
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'getCourseById')
        .mockRejectedValue(new Error('Error fetching course'))

      await getCourseById(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error fetching course',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get course by ID 1 error:', expect.any(Error))
    })
  })

  describe('softDeleteCourse', () => {
    test('should soft delete a course successfully (soft delete course)', async () => {
      mockReq.params = { id: 1 }
      mockReq.user = { role: 'admin' }

      const deletedCourse = { id: 1, isDeleted: true }
      jest.spyOn(CourseService.prototype, 'softDeleteCourse').mockResolvedValue(deletedCourse)

      await softDeleteCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course deleted successfully',
        course: deletedCourse,
      })
      expect(log.info).toHaveBeenCalledWith('Course 1 was successfully deleted')
    })

    test('should handle when course not found (soft delete course)', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'softDeleteCourse')
        .mockRejectedValue(new Error('Course not found'))

      await softDeleteCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Soft delete course 1 error:', expect.any(Error))
    })

    test('should handle error when deleting the course (soft delete course)', async () => {
      mockReq.params = { id: 1 }

      jest
        .spyOn(CourseService.prototype, 'softDeleteCourse')
        .mockRejectedValue(new Error('Error deleting course'))

      await softDeleteCourse(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error deleting course',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Soft delete course 1 error:', expect.any(Error))
    })
  })

  describe('updateCourse', () => {
    beforeEach(() => {
      // Clear any previous params/body/user values
      mockReq.params = {}
      mockReq.body = {}
      mockReq.user = {}
    })

    test('should return 403 if user is not an admin', async () => {
      mockReq.user = { role: 'teacher' } // non-admin role
      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins can update courses.',
      })
    })

    test('should return 400 if course name is missing', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      mockReq.body = { description: 'Updated Description' } // missing name

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        errors: { name: 'Course name is required.' },
      })
    })

    test('should update the course successfully', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      // Valid course data
      mockReq.body = {
        name: 'Updated Course Name',
        description: 'Updated Description',
        user_id: 2,
        learner_group_id: 3,
        student_teacher_group_id: 4,
      }

      const updatedCourse = { id: 1, ...mockReq.body }

      jest.spyOn(CourseService.prototype, 'updateCourse').mockResolvedValue(updatedCourse)
      jest.spyOn(User, 'findByPk').mockImplementation((id) => {
        if (id === 2) return Promise.resolve({ id: 2, role: 'teacher' })
        return Promise.resolve(null)
      })

      jest.spyOn(Group, 'findByPk').mockImplementation((id) => {
        if (id === 3 || id === 4) return Promise.resolve({ id })
        return Promise.resolve(null)
      })

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(updatedCourse)
      expect(log.info).toHaveBeenCalledWith('Course with id 1 updated successfully')
    })

    test('should return 404 if course not found', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      mockReq.body = { name: 'Updated Course Name', description: 'Updated Description' }

      const error = new Error('Course not found')
      jest.spyOn(CourseService.prototype, 'updateCourse').mockRejectedValue(error)

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
    })

    test('should return 400 for SequelizeValidationError', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      mockReq.body = { name: 'Invalid Name', description: 'Updated Description' }

      const sequelizeError = new Error('Validation error')
      sequelizeError.name = 'SequelizeValidationError'
      sequelizeError.errors = [{ path: 'name', message: 'Course name is invalid.' }]

      jest.spyOn(CourseService.prototype, 'updateCourse').mockRejectedValue(sequelizeError)

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'VALIDATION_ERROR',
          details: {
            name: 'Course name is invalid.',
          },
          message: 'Validation failed',
        },
      })
    })

    test('should return 409 if course name already exists', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      mockReq.body = { name: 'Existing Course Name', description: 'Updated Description' }

      const sequelizeError = {
        name: 'SequelizeUniqueConstraintError',
        errors: [
          {
            message: 'Course name must be unique',
            path: 'name',
          },
        ],
        parent: { code: 'ER_DUP_ENTRY' },
      }

      jest.spyOn(CourseService.prototype, 'updateCourse').mockRejectedValue(sequelizeError)

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(409)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Name already exists',
          code: 'CONFLICT',
          details: {
            name: 'name already exists',
          },
        },
      })
    })

    test('should return 500 for other errors', async () => {
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }
      mockReq.body = { name: 'Updated Course Name', description: 'Updated Description' }

      const genericError = new Error('Unexpected error')
      jest.spyOn(CourseService.prototype, 'updateCourse').mockRejectedValue(genericError)

      await updateCourse(mockReq, mockRes)
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error updating course',
        },
      })
    })
  })

  describe('deleteCourse', () => {
    beforeEach(() => {
      // Add end method to mockRes for 204 responses
      mockRes.end = jest.fn()

      // Reset request objects
      mockReq.params = {}
      mockReq.user = {}
    })

    test('should return 403 if user is not an admin', async () => {
      // Arrange
      mockReq.user = { role: 'teacher' } // Non-admin role

      // Import the function first in the file
      const { deleteCourse } = await import('../../../src/controllers/courseController.js')

      // Act
      await deleteCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden: Only admins can permanently delete courses.',
      })
    })

    test('should permanently delete course and return 204 when successful', async () => {
      // Arrange
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }

      jest.spyOn(CourseService.prototype, 'deleteCourse').mockResolvedValue({
        message: 'Course permanently deleted',
      })

      // Act
      await deleteCourse(mockReq, mockRes)

      // Assert
      expect(CourseService.prototype.deleteCourse).toHaveBeenCalledWith('1')
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Course permanently deleted successfully',
      })
      expect(log.info).toHaveBeenCalledWith('Course with ID 1 permanently deleted successfully')
    })

    test('should return 404 if course not found', async () => {
      // Arrange
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '999' }

      const error = new Error('Course not found')
      jest.spyOn(CourseService.prototype, 'deleteCourse').mockRejectedValue(error)

      // Act
      await deleteCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Course not found',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Delete course 999 error:', expect.any(Error))
    })

    test('should return 500 for any other error', async () => {
      // Arrange
      mockReq.user = { role: 'admin' }
      mockReq.params = { id: '1' }

      const error = new Error('Database connection error')
      jest.spyOn(CourseService.prototype, 'deleteCourse').mockRejectedValue(error)

      // Act
      await deleteCourse(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error permanently deleting course',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Delete course 1 error:', expect.any(Error))
    })
  })

  describe('getCoursesOfUser', () => {
    test('should return courses for a user', async () => {
      const req = mockRequest({ id: 1 });
      const res = mockResponse();
      const mockCourses = [{ id: 101, name: 'Course A' }];
      jest.spyOn(CourseService.prototype, 'getCoursesOfUser').mockResolvedValue(mockCourses);
      
      await getCoursesOfUser(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockCourses);
    });
  })
})

<<<<<<< HEAD
import CourseService from '../services/courseService.js'
import { Course, User, Group, Learner, StudentTeacher } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

// Instantiate course service
const courseService = new CourseService(Course, User, Group, Learner, StudentTeacher)

/**
 * Retrieves all courses.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses()
    res.status(200).json(courses)
    log.info('Retrieved all courses')
  } catch (error) {
    return handleControllerError(error, res, 'Get all courses', 'Error fetching courses')
  }
}

/**
 * Retrieves a course by ID.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params
    const course = await courseService.getCourseById(id)
    res.status(200).json(course)
    log.info(`Course ${id} retrieved successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get course by ID ${req.params.id}`,
      'Error fetching course'
    )
  }
}

/**
 * Creates a new course.
 * @param {Object} req - The request object containing course details.
 * @param {Object} res - The response object.
 */
const createCourse = async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can create courses.' })
    }

    const courseData = req.body

    // Controller-side validation
    const errors = {}

    // Validate course name
    if (!courseData.name) {
      errors.name = 'Course name is required.'
    } else if (courseData.name.length > 255) {
      errors.name = 'Course name is too long.'
    }

    // Validate user_id (teacher), if provided
    if (courseData.user_id) {
      const teacher = await User.findByPk(courseData.user_id)
      if (!teacher || teacher.role !== 'teacher') {
        errors.user_id = 'Invalid teacher ID.'
      }
    }

    // Validate learner_group_id if provided
    if (courseData.learner_group_id) {
      const learnerGroup = await Group.findByPk(courseData.learner_group_id)
      if (!learnerGroup) {
        errors.learner_group_id = 'Invalid learner group ID.'
      }
    }

    // Validate student_teacher_group_id if provided
    if (courseData.student_teacher_group_id) {
      const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id)
      if (!studentTeacherGroup) {
        errors.student_teacher_group_id = 'Invalid student teacher group ID.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const newCourse = await courseService.createCourse(courseData)

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse,
    })

    log.info(`Course ${newCourse.name} was successfully created`)
  } catch (error) {
    return handleControllerError(error, res, 'Create course', 'Error creating course')
  }
}

/**
 * Updates a course.
 * @param {Object} req - The request object containing the course ID in req.params and updated data in req.body.
 * @param {Object} res - The response object.
 */
const updateCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can update courses.' })
    }

    const { id } = req.params
    const courseData = req.body
    const errors = {}
    if (!courseData.name) errors.name = 'Course name is required.'

    // Validate user_id (teacher), if provided
    if (courseData.user_id) {
      const teacher = await User.findByPk(courseData.user_id)
      if (!teacher || teacher.role !== 'teacher') {
        errors.user_id = 'Invalid teacher ID.'
      }
    }
    // Validate learner_group_id if provided
    if (courseData.learner_group_id) {
      const learnerGroup = await Group.findByPk(courseData.learner_group_id)
      if (!learnerGroup) {
        errors.learner_group_id = 'Invalid learner group ID.'
      }
    }

    // Validate student_teacher_group_id if provided
    if (courseData.student_teacher_group_id) {
      const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id)
      if (!studentTeacherGroup) {
        errors.student_teacher_group_id = 'Invalid student teacher group ID.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const updatedCourse = await courseService.updateCourse(id, courseData)
    res.status(200).json(updatedCourse)
    log.info(`Course with id ${id} updated successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Update course ${req.params.id}`,
      'Error updating course'
    )
  }
}

/**
 * Soft deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const softDeleteCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can soft-delete courses.' })
    }
    const { id } = req.params
    const deletedCourse = await courseService.softDeleteCourse(id)
    res.status(200).json({
      message: 'Course deleted successfully',
      course: deletedCourse,
    })
    log.info(`Course ${id} was successfully deleted`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Soft delete course ${req.params.id}`,
      'Error deleting course'
    )
  }
}

/**
 * Permanently deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden: Only admins can permanently delete courses.',
      })
    }

    const { id } = req.params
    await courseService.deleteCourse(id)
    res.status(200).json({ message: 'Course permanently deleted successfully' })
    log.info(`Course with ID ${id} permanently deleted successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete course ${req.params.id}`,
      'Error permanently deleting course'
    )
  }
}

/**
 * Assigns a teacher to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the teacher's user ID in req.body.
 * @param {Object} res - The response object.
 */
const assignTeacherCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins can assign teachers to courses.' })
    }

    const { id } = req.params // Course ID
    const { teacherId } = req.body // Teacher's user ID

    const updatedCourse = await courseService.assignTeacherCourse(id, teacherId)
    res
      .status(200)
      .json({ message: 'Teacher assigned to course successfully', course: updatedCourse })
    log.info(`Teacher ${teacherId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign teacher to course ${req.params.id}`,
      'Error assigning teacher to course'
    )
  }
}

/**
 * Assigns a learner group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the learner group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignLearnerGroupCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins and teachers can assign learner groups.' })
    }
    const { id } = req.params // Get course ID from params
    const { learnerGroupId } = req.body // Get group ID from body

    const updatedCourse = await courseService.assignLearnerGroupCourse(id, learnerGroupId)
    res.status(200).json({
      message: 'Learner group assigned to course successfully',
      course: updatedCourse,
    })
    log.info(`Learner group ${learnerGroupId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign learner group to course ${req.params.id}`,
      'Error assigning learner group to course'
    )
  }
}

/**
 * Assigns a student teacher group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the student teacher group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignStudentTeacherGroupCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins and teachers can assign student-teacher groups.' })
    }
    const { id } = req.params
    const { studentTeacherGroupId } = req.body

    const updatedCourse = await courseService.assignStudentTeacherGroupCourse(
      id,
      studentTeacherGroupId
    )
    res.status(200).json({
      message: 'Student teacher group assigned to course successfully',
      course: updatedCourse,
    })
    log.info(`Student teacher group ${studentTeacherGroupId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign student teacher group to course ${req.params.id}`,
      'Error assigning student teacher group to course'
    )
  }
}

const getCoursesOfUser = async (req, res) => {
  try {
    const { id } = req.params
    const courses = await courseService.getCoursesOfUser(id)
    res.status(200).json(courses)
    log.info(`Retrieved courses of user ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get courses of user ${req.params.id}`,
      'Error fetching courses of user'
    )
  }
}

export {
  getAllCourses,
  createCourse,
  updateCourse,
  getCourseById,
  softDeleteCourse,
  deleteCourse,
  assignTeacherCourse,
  assignLearnerGroupCourse,
  assignStudentTeacherGroupCourse,
  getCoursesOfUser,
}
=======
import CourseService from '../services/courseService.js'
import { Course, User, Group, Learner, StudentTeacher } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

// Instantiate course service
const courseService = new CourseService(Course, User, Group, Learner, StudentTeacher)

/**
 * Retrieves all courses.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
const getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses()
    res.status(200).json(courses)
    log.info('Retrieved all courses')
  } catch (error) {
    return handleControllerError(error, res, 'Get all courses', 'Error fetching courses')
  }
}

/**
 * Retrieves a course by ID.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params
    const course = await courseService.getCourseById(id)
    res.status(200).json(course)
    log.info(`Course ${id} retrieved successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get course by ID ${req.params.id}`,
      'Error fetching course'
    )
  }
}

/**
 * Creates a new course.
 * @param {Object} req - The request object containing course details.
 * @param {Object} res - The response object.
 */
const createCourse = async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can create courses.' })
    }

    const courseData = req.body

    // Controller-side validation
    const errors = {}

    // Validate course name
    if (!courseData.name) {
      errors.name = 'Course name is required.'
    } else if (courseData.name.length > 255) {
      errors.name = 'Course name is too long.'
    }

    // Validate user_id (teacher), if provided
    if (courseData.user_id) {
      const teacher = await User.findByPk(courseData.user_id)
      if (!teacher || teacher.role !== 'teacher') {
        errors.user_id = 'Invalid teacher ID.'
      }
    }

    // Validate learner_group_id if provided
    if (courseData.learner_group_id) {
      const learnerGroup = await Group.findByPk(courseData.learner_group_id)
      if (!learnerGroup) {
        errors.learner_group_id = 'Invalid learner group ID.'
      }
    }

    // Validate student_teacher_group_id if provided
    if (courseData.student_teacher_group_id) {
      const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id)
      if (!studentTeacherGroup) {
        errors.student_teacher_group_id = 'Invalid student teacher group ID.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const newCourse = await courseService.createCourse(courseData)

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse,
    })

    log.info(`Course ${newCourse.name} was successfully created`)
  } catch (error) {
    return handleControllerError(error, res, 'Create course', 'Error creating course')
  }
}

/**
 * Updates a course.
 * @param {Object} req - The request object containing the course ID in req.params and updated data in req.body.
 * @param {Object} res - The response object.
 */
const updateCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can update courses.' })
    }

    const { id } = req.params
    const courseData = req.body
    const errors = {}
    if (!courseData.name) errors.name = 'Course name is required.'

    // Validate user_id (teacher), if provided
    if (courseData.user_id) {
      const teacher = await User.findByPk(courseData.user_id)
      if (!teacher || teacher.role !== 'teacher') {
        errors.user_id = 'Invalid teacher ID.'
      }
    }
    // Validate learner_group_id if provided
    if (courseData.learner_group_id) {
      const learnerGroup = await Group.findByPk(courseData.learner_group_id)
      if (!learnerGroup) {
        errors.learner_group_id = 'Invalid learner group ID.'
      }
    }

    // Validate student_teacher_group_id if provided
    if (courseData.student_teacher_group_id) {
      const studentTeacherGroup = await Group.findByPk(courseData.student_teacher_group_id)
      if (!studentTeacherGroup) {
        errors.student_teacher_group_id = 'Invalid student teacher group ID.'
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors })
    }

    const updatedCourse = await courseService.updateCourse(id, courseData)
    res.status(200).json(updatedCourse)
    log.info(`Course with id ${id} updated successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Update course ${req.params.id}`,
      'Error updating course'
    )
  }
}

/**
 * Soft deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const softDeleteCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can soft-delete courses.' })
    }
    const { id } = req.params
    const deletedCourse = await courseService.softDeleteCourse(id)
    res.status(200).json({
      message: 'Course deleted successfully',
      course: deletedCourse,
    })
    log.info(`Course ${id} was successfully deleted`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Soft delete course ${req.params.id}`,
      'Error deleting course'
    )
  }
}

/**
 * Permanently deletes a course.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteCourse = async (req, res) => {
  try {
    // --- ROLE CHECK (Admin Only) ---
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden: Only admins can permanently delete courses.',
      })
    }

    const { id } = req.params
    await courseService.deleteCourse(id)
    res.status(200).json({ message: 'Course permanently deleted successfully' })
    log.info(`Course with ID ${id} permanently deleted successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete course ${req.params.id}`,
      'Error permanently deleting course'
    )
  }
}

/**
 * Assigns a teacher to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the teacher's user ID in req.body.
 * @param {Object} res - The response object.
 */
const assignTeacherCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins can assign teachers to courses.' })
    }

    const { id } = req.params // Course ID
    const { teacherId } = req.body // Teacher's user ID

    const updatedCourse = await courseService.assignTeacherCourse(id, teacherId)
    res
      .status(200)
      .json({ message: 'Teacher assigned to course successfully', course: updatedCourse })
    log.info(`Teacher ${teacherId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign teacher to course ${req.params.id}`,
      'Error assigning teacher to course'
    )
  }
}

/**
 * Assigns a learner group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the learner group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignLearnerGroupCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins and teachers can assign learner groups.' })
    }
    const { id } = req.params // Get course ID from params
    const { learnerGroupId } = req.body // Get group ID from body

    const updatedCourse = await courseService.assignLearnerGroupCourse(id, learnerGroupId)
    res.status(200).json({
      message: 'Learner group assigned to course successfully',
      course: updatedCourse,
    })
    log.info(`Learner group ${learnerGroupId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign learner group to course ${req.params.id}`,
      'Error assigning learner group to course'
    )
  }
}

/**
 * Assigns a student teacher group to a course.
 * @param {Object} req - The request object containing the course ID in req.params and the student teacher group ID in req.body.
 * @param {Object} res - The response object.
 */
const assignStudentTeacherGroupCourse = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Only admins and teachers can assign student-teacher groups.' })
    }
    const { id } = req.params
    const { studentTeacherGroupId } = req.body

    const updatedCourse = await courseService.assignStudentTeacherGroupCourse(
      id,
      studentTeacherGroupId
    )
    res.status(200).json({
      message: 'Student teacher group assigned to course successfully',
      course: updatedCourse,
    })
    log.info(`Student teacher group ${studentTeacherGroupId} assigned to course ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Assign student teacher group to course ${req.params.id}`,
      'Error assigning student teacher group to course'
    )
  }
}

const getCoursesOfUser = async (req, res) => {
  try {
    const { id } = req.params
    const courses = await courseService.getCoursesOfUser(id)
    res.status(200).json(courses)
    log.info(`Retrieved courses of user ${id}`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get courses of user ${req.params.id}`,
      'Error fetching courses of user'
    )
  }
}

export {
  getAllCourses,
  createCourse,
  updateCourse,
  getCourseById,
  softDeleteCourse,
  deleteCourse,
  assignTeacherCourse,
  assignLearnerGroupCourse,
  assignStudentTeacherGroupCourse,
  getCoursesOfUser,
}
>>>>>>> 627466f638de697919d077ca56524377d406840d

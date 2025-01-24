import CourseService from '../services/courseService.js'
import { Course } from '../models/Course.js'
import { log } from '../utils/logger.js'

const courseService = new CourseService(Course)

const getAllCourses = async (_req, res) => {
  try {
    const courses = await courseService.getAllCourses()
    res.status(200).json(courses)
    log.info('Retrieved all courses')
  } catch (error) {
    log.error('Get all courses error:', error)
    return res.status(500).json({ message: 'Failed to retrieve courses' })
  }
}

const createCourse = async (req, res) => {
  try {
    const { name, description } = req.body
    const newCourse = await courseService.createCourse(name, description)

    res.status(201).json({
      message: 'Course created successfully',
      course: newCourse,
    })
    log.info(`Course ${name} was successfully created`)
  } catch (error) {
    log.error('Create course error:', error)
    if (error.message === 'Course name is required') {
      return res.status(400).json({
        message: 'Course name is required',
      })
    }
    if (error.message === 'Course description is required') {
      return res.status(400).json({
        message: 'Course description is required',
      })
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Course name already exists',
      })
    }
    if (error.name === 'SequelizeValidationError') {
      const field = error.errors ? error.errors[0].path : 'unknown'
      return res.status(400).json({
        message: error.message,
        field: field,
      })
    }
    return res.status(500).json({ message: 'Error creating course' })
  }
}

const assignStudentTeacherGroupCourse = async (req, res) => {
  try {
    const { courseId, studentTeacherGroupId } = req.body
    const course = await courseService.assignStudentTeacherGroupCourse(courseId, studentTeacherGroupId)

    res.status(200).json({
      message: 'Student teacher group assigned to course successfully',
      course,
    })
    log.info(`Student teacher group assigned to course ${courseId}`)
  } catch (error) {
    log.error('Assign student teacher group course error:', error)
    if (error.message === 'Course not found') {
      return res.status(404).json({
        message: 'Course not found',
      })
    }
    return res.status(500).json({ message: 'Error assigning student teacher group to course' })
  }
}

const assignLearnerGroupCourse = async (req, res) => {
  try {
    const { courseId, learnerGroupId } = req.body
    const course = await courseService.assignLearnerGroupCourse(courseId, learnerGroupId)

    res.status(200).json({
      message: 'Learner group assigned to course successfully',
      course,
    })
    log.info(`Learner group assigned to course ${courseId}`)
  } catch (error) {
    log.error('Assign learner group course error:', error)
    if (error.message === 'Course not found') {
      return res.status(404).json({
        message: 'Course not found',
      })
    }
    return res.status(500).json({ message: 'Error assigning learner group to course' })
  }
} 

const assignTeacherCourse = async (req, res) => {
  try {
    const { courseId, userId } = req.body
    const course = await courseService.assignTeacherCourse(courseId, userId)

    res.status(200).json({
      message: 'Teacher assigned to course successfully',
      course,
    })
    log.info(`Teacher assigned to course ${courseId}`)
  } catch (error) {
    log.error('Assign teacher course error:', error)
    if (error.message === 'Course not found') {
      return res.status(404).json({
        message: 'Course not found',
      })
    }
    return res.status(500).json({ message: 'Error assigning teacher to course' })
  }
}

export { getAllCourses, createCourse, assignStudentTeacherGroupCourse, assignLearnerGroupCourse, assignTeacherCourse }

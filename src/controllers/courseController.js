import courseService from '../services/courseService.js'
import { log } from '../utils/logger.js'

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

export { getAllCourses, createCourse }

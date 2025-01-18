import { User } from '../../src/models/User.js'
import { Course } from '../../src/models/Course.js'
import { School } from '../../src/models/School.js'
import { StudentTeacher } from '../../src/models/StudentTeacher.js'
import { Teacher } from '../../src/models/Teacher.js'
import { Admin } from '../../src/models/Admin.js'
import { Learner } from '../../src/models/Learner.js'
import { validUsers } from '../fixtures/userData.js'
import { validCourses } from '../fixtures/courseData.js'
import { validSchools } from '../fixtures/schoolData.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

/**
 * Creates a test school.
 * @param {Object} overrides - Fields to override in the school data.
 * @returns {Promise<School>} The created school.
 */
export const createTestSchool = async (overrides = {}) => {
  const schoolData = { ...validSchools[0], ...overrides }
  return await School.create(schoolData)
}

/**
 * Creates a test user.
 * @param {Object} overrides - Fields to override in the user data.
 * @returns {Promise<User>} The created user.
 */
export const createTestUser = async (overrides = {}, role) => {
  const userData = { ...validUsers[0], ...overrides }
  userData.password = await bcrypt.hash(userData.password, 10)
  const user = await User.create(userData)
  const school = await createTestSchool()
  user.school_id = school.id
  await user.save()

  if (role === 'learner') {
    await Learner.create({ user_id: user.user_id })
  } else if (role === 'teacher') {
    await Teacher.create({ user_id: user.user_id })
  } else if (role === 'admin') {
    await Admin.create({ user_id: user.user_id })
  } else if (role === 'student_teacher') {
    await StudentTeacher.create({ user_id: user.user_id })
  }
  return user
}

/**
 * Creates a test course.
 * @param {Object} overrides - Fields to override in the course data.
 * @returns {Promise<Course>} The created course.
 */
export const createTestCourse = async (overrides = {}) => {
  const courseData = { ...validCourses[0], ...overrides }
  return await Course.create(courseData)
}

/**
 * Generates a JWT token for a given user.
 * @param {User} user - The user for whom to generate the token.
 * @returns {string} The JWT token.
 */
export const generateAuthToken = (user) => {
  return jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

/**
 * Clears all users from the database.
 * @returns {Promise<void>}
 */
export const clearUsers = async () => {
  await User.destroy({ where: {} })
}

/**
 * Clears all courses from the database.
 * @returns {Promise<void>}
 */
export const clearCourses = async () => {
  await Course.destroy({ where: {} })
}

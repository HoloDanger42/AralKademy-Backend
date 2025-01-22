import { User } from '../../src/models/User.js'
import { Course } from '../../src/models/Course.js'
import { School } from '../../src/models/School.js'
import { Enrollment } from '../../src/models/Enrollment.js'
import { StudentTeacher } from '../../src/models/StudentTeacher.js'
import { Teacher } from '../../src/models/Teacher.js'
import { Admin } from '../../src/models/Admin.js'
import { Learner } from '../../src/models/Learner.js'
import { Group } from '../../src/models/Group.js'
import { validUsers } from '../fixtures/userData.js'
import { validCourses } from '../fixtures/courseData.js'
import { validSchools } from '../fixtures/schoolData.js'
import { validEnrollment } from '../fixtures/enrollmentData.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

/**
 * Creates a test enrollment for testing.
 * @param {Object} overrides - Fields to override in the enrollment data.
 * @returns {Promise<Enrollment>} The created enrollment.
 */
export const createTestEnrollment = async (overrides = {}) => {
  const enrollmentData = {
    ...validEnrollment[0],
    school_id: school.school_id,
    handled_by_id: admin.id,
    ...overrides,
  }
  return await Enrollment.create({ enrollmentData })
}
/**
 * Creates a test school.
 * @param {Object} overrides - Fields to override in the school data.
 * @returns {Promise<School>} The created school.
 */
export const createTestSchool = async (overrides = {}) => {
  try {
    const schoolData = { ...validSchools[0], ...overrides }

    const school = await School.create(schoolData)
    if (!school) {
      throw new Error('Failed to create test school')
    }
    return school
  } catch (error) {
    console.error('Error creating test school:', error)
    throw error
  }
}

/**
 * Creates a test user.
 * @param {Object} overrides - Fields to override in the user data.
 * @returns {Promise<User>} The created user.
 */
export const createTestUser = async (overrides = {}, role) => {
  try {
    const school = await createTestSchool()
    const timestamp = Date.now()
    const userData = {
      ...validUsers[0],
      email: `test${timestamp}@example.com`,
      ...overrides,
      role: role || 'learner',
    }

    // Map camelCase to snake_case
    const formattedUserData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: await bcrypt.hash(userData.password, 10),
      role: userData.role,
      school_id: school.school_id,
      birth_date: userData.birth_date || null,
      contact_no: userData.contact_no || null,
    }

    const user = await User.create(formattedUserData)

    if (role === 'learner') {
      const admin = await createTestUser({}, 'admin')
      const enrollment = await createTestEnrollment({}, school, admin)

      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
    } else if (role === 'teacher') {
      await Teacher.create({ user_id: user.id })
    } else if (role === 'admin') {
      await Admin.create({ user_id: user.id })
    } else if (role === 'student_teacher') {
      await StudentTeacher.create({
        user_id: user.id,
        section: 'Test Section',
        department: 'Test Department',
      })
    }

    return user
  } catch (error) {
    console.error('Error creating test user:', error)
    throw error
  }
}

/**
 * Creates a test course.
 * @param {Object} overrides - Fields to override in the course data.
 * @returns {Promise<Course>} The created course.
 */
export const createTestCourse = async (overrides = {}) => {
  try {
    const school = await createTestSchool()

    const user = await User.create({
      ...validUsers[1],
      email: `test${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      school_id: school.school_id,
    })

    await Teacher.create({
      user_id: user.id,
      department: 'Test Department',
      emp_status: 'Full-time',
    })

    const studentTeacherGroup = await Group.create({
      name: 'Test ST Group',
      group_type: 'student_teacher',
    })

    const learnerGroup = await Group.create({
      name: 'Test Learner Group',
      group_type: 'learner',
    })

    // Use fixture data with proper references
    const courseData = {
      ...validCourses[0],
      user_id: user.id,
      student_teacher_group_id: studentTeacherGroup.group_id,
      learner_group_id: learnerGroup.group_id,
      ...overrides,
    }

    return await Course.create(courseData)
  } catch (error) {
    console.error('Error creating test course:', error)
    throw error
  }
}

/**
 * Creates a test group.
 * @param {Object} overrides - Fields to override in the group data.
 * @returns {Promise<Group>} The created group.
 */
export const createTestGroup = async (overrides = {}) => {
  try {
    const timestamp = Date.now()
    const groupData = {
      name: `Test Group ${timestamp}`,
      description: 'Test group description',
      group_type: 'learner',
      ...overrides,
    }

    const group = await Group.create(groupData)
    if (!group) {
      throw new Error('Failed to create test group')
    }

    return group
  } catch (error) {
    console.error('Error creating test group:', error)
    throw error
  }
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

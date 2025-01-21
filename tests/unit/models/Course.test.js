import { sequelize } from '../../../src/config/database.js'
import { Course } from '../../../src/models/Course.js'
import { validCourses, invalidCourses } from '../../fixtures/courseData.js'
import {
  createTestUser,
  createTestGroup,
  clearUsers,
  clearCourses,
} from '../../helpers/testData.js'
import models from '../../../src/models/associate.js'

describe('Course Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  beforeEach(async () => {
    await clearUsers()
    await clearCourses()
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // Test valid course creations
  validCourses.forEach(({ name, description }) => {
    test(`should create a course successfully: ${name}`, async () => {
      try {
        const teacher = await createTestUser({ email: 'teacher@test.com' }, 'teacher')

        // Create groups
        const stGroup = await createTestGroup({
          name: 'ST Group',
          group_type: 'student_teacher',
        })

        const learnerGroup = await createTestGroup({
          name: 'Learner Group',
          group_type: 'learner',
        })

        // Create course with valid references
        const course = await Course.create({
          name: name,
          description: description,
          user_id: teacher.id,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })

        expect(course).toHaveProperty('id')
        expect(course.name).toBe(name)
        expect(course.description).toBe(description)
        expect(course.user_id).toBe(teacher.id)
        expect(course.student_teacher_group_id).toBe(stGroup.group_id)
        expect(course.learner_group_id).toBe(learnerGroup.group_id)
      } catch (error) {
        console.error('Test failed:', error)
        throw error
      }
    })
  })

  // Test invalid course creations
  invalidCourses.forEach((courseData) => {
    test(`should fail to create a course with data: ${JSON.stringify(courseData)}`, async () => {
      await expect(Course.create(courseData)).rejects.toThrow()
    })
  })

  // Test duplicate course name creation
  describe('Duplicate Course Name', () => {
    test('should fail to create a course with a duplicate name', async () => {
      try {
        // Create teachers
        const teacher1 = await createTestUser(
          {
            email: 'teacher1@test.com',
          },
          'teacher'
        )

        // Create groups and log them
        const stGroup1 = await createTestGroup({
          name: 'ST Group 1',
          group_type: 'student_teacher',
        })

        const learnerGroup1 = await createTestGroup({
          name: 'Learner Group 1',
          group_type: 'learner',
        })

        // Create first course with correct group IDs
        const course = await Course.create({
          name: 'Unique Course',
          description: 'First instance of unique course.',
          user_id: teacher1.id,
          student_teacher_group_id: stGroup1.group_id,
          learner_group_id: learnerGroup1.group_id,
        })
        console.log('Created course:', course.toJSON())

        // Try creating duplicate course
        await expect(
          Course.create({
            name: 'Unique Course',
            description: 'Duplicate course name.',
            user_id: teacher1.id,
            student_teacher_group_id: stGroup1.group_id,
            learner_group_id: learnerGroup1.group_id,
          })
        ).rejects.toThrow('Course name already exists')
      } catch (error) {
        console.error('Test failed:', error)
        throw error
      }
    })
  })

  afterEach(async () => {
    await Course.destroy({ where: {} })
  })
})

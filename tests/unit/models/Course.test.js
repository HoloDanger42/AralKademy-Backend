import { sequelize } from '../../../src/config/database.js'
import { Course } from '../../../src/models/Course.js'
import { validCourses, invalidCourses } from '../../fixtures/courseData.js'

describe('Course Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // Test valid course creations
  validCourses.forEach(({ name, description }) => {
    test(`should create a course successfully: ${name}`, async () => {
      const course = await Course.create({ name, description })

      expect(course).toHaveProperty('id')
      expect(course.name).toBe(name)
      expect(course.description).toBe(description)
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
      // Create the initial course
      await Course.create({
        name: 'Unique Course',
        description: 'First instance of unique course.',
      })

      // Attempt to create another course with the same name
      await expect(
        Course.create({
          name: 'Unique Course',
          description: 'Duplicate course name.',
        })
      ).rejects.toThrow('Course name already exists')
    })
  })

  afterEach(async () => {
    await Course.destroy({ where: {} })
  })
})

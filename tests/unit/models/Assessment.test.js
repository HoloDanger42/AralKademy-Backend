import { Assessment, Course } from '../../../src/models/index.js'
import { sequelize } from '../../../src/config/database.js'

describe('Assessment Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await Assessment.destroy({ where: {}, force: true })
    await Course.destroy({ where: {}, force: true })
  })

  test('should create a valid assessment', async () => {
    // Create a test course first
    const course = await Course.create({
      name: 'Test Course',
      description: 'This is a test course',
      status: 'active',
    })

    const assessmentData = {
      title: 'Midterm Exam',
      description: 'Midterm examination for Test Course',
      course_id: course.id,
      type: 'exam',
      max_score: 100,
      passing_score: 60,
      duration_minutes: 90,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      is_published: false,
    }

    const assessment = await Assessment.create(assessmentData)

    expect(assessment).toHaveProperty('id')
    expect(assessment.title).toBe('Midterm Exam')
    expect(assessment.course_id).toBe(course.id)
    expect(assessment.type).toBe('exam')
  })

  test('should not create assessment without required fields', async () => {
    const invalidData = {
      description: 'Missing required fields',
    }

    await expect(Assessment.create(invalidData)).rejects.toThrow()
  })

  test('should validate assessment type', async () => {
    const course = await Course.create({
      name: 'Test Course',
      description: 'This is a test course',
      status: 'active',
    })

    const invalidType = {
      title: 'Invalid Type Test',
      description: 'Test with invalid type',
      course_id: course.id,
      type: 'invalid_type', // not in enum
      max_score: 100,
    }

    await expect(Assessment.create(invalidType)).rejects.toThrow()
  })
})

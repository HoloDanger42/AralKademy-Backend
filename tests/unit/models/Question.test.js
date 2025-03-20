import { Assessment, Question, Course } from '../../../src/models/index.js'
import { sequelize } from '../../../src/config/database.js'

describe('Question Model', () => {
  let testAssessment

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create a test course and assessment for all tests
    const course = await Course.create({
      name: 'Test Course',
      description: 'Test Course Description',
      status: 'active',
    })

    testAssessment = await Assessment.create({
      title: 'Test Assessment',
      description: 'Test Description',
      course_id: course.id,
      type: 'quiz',
      max_score: 100,
      passing_score: 60,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  beforeEach(async () => {
    await Question.destroy({ where: {}, force: true })
  })

  test('should create a valid question', async () => {
    const questionData = {
      assessment_id: testAssessment.id,
      question_text: 'What is the capital of France?',
      question_type: 'multiple_choice',
      points: 10,
      order_index: 1,
    }

    const question = await Question.create(questionData)

    expect(question).toHaveProperty('id')
    expect(question.question_text).toBe('What is the capital of France?')
    expect(question.assessment_id).toBe(testAssessment.id)
    expect(question.question_type).toBe('multiple_choice')
  })

  test('should not create question without required fields', async () => {
    const invalidData = {
      assessment_id: testAssessment.id,
      // Missing question_text
      question_type: 'multiple_choice',
    }

    await expect(Question.create(invalidData)).rejects.toThrow()
  })

  test('should validate question type', async () => {
    const invalidType = {
      assessment_id: testAssessment.id,
      question_text: 'Test question',
      question_type: 'invalid_type', // not in enum
      points: 10,
    }

    await expect(Question.create(invalidType)).rejects.toThrow()
  })
})

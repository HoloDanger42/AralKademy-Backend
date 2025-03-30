import request from 'supertest'
import app from '../../src/server.js'
import { sequelize } from '../../src/config/database.js'
import { Course, User, Assessment, School, Teacher, Module } from '../../src/models/index.js'
import bcrypt from 'bcryptjs'
import '../../src/models/associate.js'

describe('Assessment API Endpoints (Integration Tests)', () => {
  let server
  let teacherToken
  let learnerToken
  let testCourse
  let testAssessment
  let testModule

  beforeAll(async () => {
    await sequelize.sync({ force: true })

    // Create test school
    const testSchool = await School.create({
      school_id: Math.floor(10000 + Math.random() * 90000),
      name: 'Test School for Assessments',
      address: '123 Test St., Test City',
      contact_no: '02-8123-4567',
    })

    server = app.listen()

    // Create teacher user
    const hashedPassword = await bcrypt.hash('Password123!', 10)
    const teacherUser = await User.create({
      email: 'teacher@assessmenttest.com',
      password: hashedPassword,
      first_name: 'Teacher',
      last_name: 'User',
      role: 'teacher',
      birth_date: new Date('1990-01-01'),
      contact_no: '09123456789',
      school_id: testSchool.school_id,
    })

    await Teacher.create({ user_id: teacherUser.id })

    // Create learner user
    const learnerUser = await User.create({
      email: 'learner@assessmenttest.com',
      password: hashedPassword,
      first_name: 'Learner',
      last_name: 'User',
      role: 'learner',
      birth_date: new Date('2000-01-01'),
      contact_no: '09123456780',
      school_id: testSchool.school_id,
    })

    // Create test course
    testCourse = await Course.create({
      name: 'Test Course for Assessments',
      description: 'A course used for testing assessments',
      user_id: teacherUser.id,
      status: 'active',
    })

    testModule = await Module.create({
      name: 'Test Module',
      course_id: testCourse.id,
      description: 'This is a test module',
    })

    // Get teacher token
    const teacherLoginResponse = await request(server).post('/api/auth/login').send({
      email: 'teacher@assessmenttest.com',
      password: 'Password123!',
      captchaResponse: 'test-captcha-token',
    })

    teacherToken = teacherLoginResponse.body.token

    // Get learner token
    const learnerLoginResponse = await request(server).post('/api/auth/login').send({
      email: 'learner@assessmenttest.com',
      password: 'Password123!',
      captchaResponse: 'test-captcha-token',
    })

    learnerToken = learnerLoginResponse.body.token

    // Create a test assessment
    testAssessment = await Assessment.create({
      title: 'Integration Test Quiz',
      description: 'A quiz for integration testing',
      module_id: testModule.module_id,
      type: 'quiz',
      max_score: 100,
      passing_score: 70,
      allowed_attempts: 2
    })
  })

  afterAll(async () => {
    await sequelize.close()
    server.close()
  })

  describe('POST /api/assessments', () => {
    test('should create a new assessment when teacher is authenticated', async () => {
      const assessmentData = {
        title: 'New Test Assessment',
        description: 'Created via integration test',
        module_id: testModule.module_id,
        allowed_attempts: 2,
        type: 'quiz',
        max_score: 100,
        passing_score: 60,
        duration_minutes: 30,
      }

      const response = await request(server)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(assessmentData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.assessment).toHaveProperty('id')
      expect(response.body.assessment.title).toBe(assessmentData.title)
    })

    test('should return 401 when no auth token is provided', async () => {
      const assessmentData = {
        title: 'Unauthorized Assessment',
        module_id: testModule.module_id,
        allowed_attempts: 2,
        type: 'quiz',
      }

      const response = await request(server).post('/api/assessments').send(assessmentData)

      expect(response.status).toBe(401)
    })

    test('should return 403 when learner tries to create assessment', async () => {
      const assessmentData = {
        title: 'Forbidden Assessment',
        module_id: testModule.module_id,
        allowed_attempts: 2,
        type: 'quiz',
      }

      const response = await request(server)
        .post('/api/assessments')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(assessmentData)

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/assessments/module/:moduleId', () => {
    test('should get all assessments for a module when authenticated', async () => {
      const response = await request(server)
        .get(`/api/assessments/module/${testModule.module_id}`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.assessments).toBeInstanceOf(Array)
      expect(response.body.assessments.length).toBeGreaterThan(0)
    })

    test('should return 401 when no auth token is provided', async () => {
      const response = await request(server).get(`/api/assessments/module/${testModule.module_id}`)

      expect(response.status).toBe(401)
    })

    test('should return 404 for non-existent module', async () => {
      const response = await request(server)
        .get('/api/assessments/module/9999')
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/assessments/:assessmentId', () => {
    test('should get assessment by ID when authenticated', async () => {
      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.assessment).toHaveProperty('id', testAssessment.id)
      expect(response.body.assessment).toHaveProperty('title', testAssessment.title)
    })

    test('should include questions when includeQuestions=true', async () => {
      // First add a question to the assessment
      const questionData = {
        question_text: 'What is 2+2?',
        question_type: 'multiple_choice',
        points: 5,
        options: [
          { text: '3', is_correct: false },
          { text: '4', is_correct: true },
          { text: '5', is_correct: false },
        ],
      }

      await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)

      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}?includeQuestions=true`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(200)
      expect(response.body.assessment).toHaveProperty('questions')
      expect(response.body.assessment.questions).toBeInstanceOf(Array)
      expect(response.body.assessment.questions.length).toBeGreaterThan(0)
    })

    test('should return 404 for non-existent assessment', async () => {
      const response = await request(server)
        .get('/api/assessments/9999')
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/assessments/:assessmentId/questions', () => {
    test('should add a question to an assessment', async () => {
      const questionData = {
        question_text: 'What is the capital of France?',
        question_type: 'multiple_choice',
        points: 10,
        options: [
          { text: 'London', is_correct: false },
          { text: 'Paris', is_correct: true },
          { text: 'Berlin', is_correct: false },
          { text: 'Madrid', is_correct: false },
        ],
      }

      const response = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.question).toHaveProperty('id')
      expect(response.body.question).toHaveProperty('question_text', questionData.question_text)
    })

    test('should return 403 when learner tries to add a question', async () => {
      const questionData = {
        question_text: 'Unauthorized question',
        question_type: 'multiple_choice',
        options: [{ text: 'Option 1', is_correct: true }],
      }

      const response = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(questionData)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/assessments/:assessmentId/submissions', () => {
    test('should start a submission when authenticated', async () => {
      const response = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.submission).toHaveProperty('id')
      expect(response.body.submission).toHaveProperty('status', 'in_progress')
      expect(response.body.submission).toHaveProperty('assessment_id', testAssessment.id)
    })

    test('should return existing submission if one is in progress', async () => {
      // Start a submission
      const firstResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)

      // Try to start another submission
      const secondResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(secondResponse.status).toBe(201)
      expect(secondResponse.body.submission.id).toBe(firstResponse.body.submission.id)
    })
  })

  describe('POST /api/assessments/submissions/:submissionId/questions/:questionId/answers', () => {
    let testSubmission
    let testQuestion

    beforeAll(async () => {
      // Create a submission
      const submissionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${learnerToken}`)

      testSubmission = submissionResponse.body.submission

      // Create a question
      const questionData = {
        question_text: 'What is 5+5?',
        question_type: 'multiple_choice',
        points: 5,
        options: [
          { text: '9', is_correct: false },
          { text: '10', is_correct: true },
          { text: '11', is_correct: false },
        ],
      }

      const questionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)

      const fullQuestionResponse = await request(server)
        .get(`/api/assessments/${testAssessment.id}?includeQuestions=true`)
        .set('Authorization', `Bearer ${teacherToken}`)

      const fullQuestion = fullQuestionResponse.body.assessment.questions.find(
        (q) => q.id === questionResponse.body.question.id
      )

      testQuestion = fullQuestion
    })

    test('should save a multiple choice answer', async () => {
      const answerData = {
        optionId: testQuestion.options[1].id, // The correct answer
      }

      const response = await request(server)
        .post(
          `/api/assessments/submissions/${testSubmission.id}/questions/${testQuestion.id}/answers`
        )
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(answerData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.answer).toHaveProperty('selected_option_id', answerData.optionId)
    })

    test('should save a text answer for short answer questions', async () => {
      // First create a short answer question
      const shortAnswerQuestion = {
        question_text: 'What is the capital of France?',
        question_type: 'short_answer',
        points: 5,
      }

      const questionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(shortAnswerQuestion)

      const answerData = {
        textResponse: 'Paris',
      }

      const response = await request(server)
        .post(
          `/api/assessments/submissions/${testSubmission.id}/questions/${questionResponse.body.question.id}/answers`
        )
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(answerData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.answer).toHaveProperty('text_response', answerData.textResponse)
    })
  })

  describe('POST /api/assessments/submissions/:submissionId/submit', () => {
    let testSubmission

    beforeAll(async () => {
      // Create a new submission
      const submissionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${learnerToken}`)

      testSubmission = submissionResponse.body.submission
    })

    test('should submit an assessment', async () => {
      const response = await request(server)
        .post(`/api/assessments/submissions/${testSubmission.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.submission).toHaveProperty('id', testSubmission.id)
      // Should be either 'submitted' for assignments or 'graded' for quizzes with auto-grading
      expect(['submitted', 'graded']).toContain(response.body.submission.status)
    })

    test('should return 403 when another user tries to submit', async () => {
      // Create a submission for the teacher
      const teacherSubmissionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)

      // Try to submit using the learner token
      const response = await request(server)
        .post(`/api/assessments/submissions/${teacherSubmissionResponse.body.submission.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(403)
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN')
    })
  })

  describe('GET /api/assessments/:assessmentId/my-submission', () => {
    test("should get user's own submission", async () => {
      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}/my-submission`)
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      // submission might be null if none exists yet
      if (response.body.submission) {
        expect(response.body.submission).toHaveProperty('assessment_id', testAssessment.id)
      }
    })

    test('should include answers when includeAnswers=true', async () => {
      // First create a submission with an answer
      const submissionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(submissionResponse.status).toBe(201)
      expect(submissionResponse.body.success).toBe(true)
      expect(submissionResponse.body).toHaveProperty('submission')

      const submissionId = submissionResponse.body.submission.id

      const questionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          question_text: 'Test question for answers test',
          question_type: 'short_answer',
          points: 5,
        })

      await request(server)
        .post(
          `/api/assessments/submissions/${submissionResponse.body.submission.id}/questions/${questionResponse.body.question.id}/answers`
        )
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ textResponse: 'Test answer' })

      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}/my-submission?includeAnswers=true`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.submission).toHaveProperty('answers')
      expect(response.body.submission.answers).toBeInstanceOf(Array)
    })
  })

  describe('GET /api/assessments/:assessmentId/submissions', () => {
    test('should get all submissions for an assessment when teacher', async () => {
      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${teacherToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.submissions).toBeInstanceOf(Array)
    })

    test('should return 403 when learner tries to access all submissions', async () => {
      const response = await request(server)
        .get(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${learnerToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/assessments/submissions/:submissionId/grade', () => {
    let learnerSubmission

    beforeAll(async () => {
      // Create and submit a learner submission
      const submissionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/submissions`)
        .set('Authorization', `Bearer ${learnerToken}`)

      learnerSubmission = submissionResponse.body.submission

      // Create a question
      const questionResponse = await request(server)
        .post(`/api/assessments/${testAssessment.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          question_text: 'Essay question for grading',
          question_type: 'essay',
          points: 20,
        })

      // Save an answer
      await request(server)
        .post(
          `/api/assessments/submissions/${learnerSubmission.id}/questions/${questionResponse.body.question.id}/answers`
        )
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ textResponse: 'This is my essay answer for grading.' })

      // Submit the assessment
      await request(server)
        .post(`/api/assessments/submissions/${learnerSubmission.id}/submit`)
        .set('Authorization', `Bearer ${learnerToken}`)
    })

    test('should grade a submission when teacher', async () => {
      const gradeData = {
        grades: [
          {
            questionId: 1, // This might need to be updated with the actual question ID
            points: 18,
            feedback: 'Good essay, just a few minor issues.',
          },
        ],
        feedback: 'Overall good work!',
      }

      const response = await request(server)
        .post(`/api/assessments/submissions/${learnerSubmission.id}/grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(gradeData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.submission).toHaveProperty('status', 'graded')
      expect(response.body.submission).toHaveProperty('feedback', gradeData.feedback)
    })

    test('should return 403 when learner tries to grade submissions', async () => {
      const gradeData = {
        grades: [{ questionId: 1, points: 10 }],
        feedback: 'Unauthorized grading',
      }

      const response = await request(server)
        .post(`/api/assessments/submissions/${learnerSubmission.id}/grade`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send(gradeData)

      expect(response.status).toBe(403)
    })
  })
})

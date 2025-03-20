import { jest } from '@jest/globals'
import AssessmentService from '../../../src/services/assessmentService.js'

describe('Assessment Service', () => {
  let assessmentService
  let mockAssessmentModel
  let mockQuestionModel
  let mockQuestionOptionModel
  let mockSubmissionModel
  let mockAnswerResponseModel
  let mockCourseModel
  let mockUserModel

  beforeEach(() => {
    mockAssessmentModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    }

    mockQuestionModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
    }

    mockQuestionOptionModel = {
      create: jest.fn(),
    }

    mockSubmissionModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
    }

    mockAnswerResponseModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    }

    mockCourseModel = {
      findByPk: jest.fn(),
    }

    mockUserModel = {}

    assessmentService = new AssessmentService(
      mockAssessmentModel,
      mockQuestionModel,
      mockQuestionOptionModel,
      mockSubmissionModel,
      mockAnswerResponseModel,
      mockCourseModel,
      mockUserModel
    )
  })

  describe('createAssessment', () => {
    test('should create an assessment successfully', async () => {
      // Arrange
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test description',
        course_id: 1,
        type: 'quiz',
      }

      const expectedAssessment = { id: 1, ...assessmentData }
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.create.mockResolvedValue(expectedAssessment)

      // Act
      const result = await assessmentService.createAssessment(assessmentData)

      // Assert
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(1)
      expect(mockAssessmentModel.create).toHaveBeenCalledWith(assessmentData)
      expect(result).toEqual(expectedAssessment)
    })

    test('should throw error if course does not exist', async () => {
      // Arrange
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test description',
        course_id: 999, // Non-existent course
        type: 'quiz',
      }

      mockCourseModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.createAssessment(assessmentData)).rejects.toThrow(
        'Course not found'
      )
      expect(mockCourseModel.findByPk).toHaveBeenCalledWith(999)
      expect(mockAssessmentModel.create).not.toHaveBeenCalled()
    })
  })

  describe('addQuestion', () => {
    test('should add a multiple choice question successfully', async () => {
      // Arrange
      const assessmentId = 1
      const questionData = {
        question_text: 'What is the capital of France?',
        question_type: 'multiple_choice',
        points: 5,
        options: [
          { text: 'Paris', is_correct: true },
          { text: 'London', is_correct: false },
          { text: 'Berlin', is_correct: false },
        ],
      }

      const mockAssessment = { id: assessmentId, title: 'Test Assessment' }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockQuestion = {
        id: 1,
        assessment_id: assessmentId,
        ...questionData,
      }
      mockQuestionModel.create.mockResolvedValue(mockQuestion)

      // Mock option creation
      const mockOption1 = { id: 1, question_id: 1, option_text: 'Paris', is_correct: true }
      const mockOption2 = { id: 2, question_id: 1, option_text: 'London', is_correct: false }
      const mockOption3 = { id: 3, question_id: 1, option_text: 'Berlin', is_correct: false }

      mockQuestionOptionModel.create
        .mockResolvedValueOnce(mockOption1)
        .mockResolvedValueOnce(mockOption2)
        .mockResolvedValueOnce(mockOption3)

      // Act
      const result = await assessmentService.addQuestion(assessmentId, questionData)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockQuestionModel.create).toHaveBeenCalledWith({
        ...questionData,
        assessment_id: assessmentId,
      })
      expect(mockQuestionOptionModel.create).toHaveBeenCalledTimes(3)
      expect(mockQuestionOptionModel.create).toHaveBeenCalledWith({
        question_id: mockQuestion.id,
        option_text: 'Paris',
        is_correct: true,
        order_index: 0,
      })
      expect(result).toEqual(mockQuestion)
    })

    test('should add a short answer question successfully', async () => {
      // Arrange
      const assessmentId = 1
      const questionData = {
        question_text: 'What is the capital of France?',
        question_type: 'short_answer',
        points: 5,
      }

      const mockAssessment = { id: assessmentId, title: 'Test Assessment' }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockQuestion = {
        id: 1,
        assessment_id: assessmentId,
        ...questionData,
      }
      mockQuestionModel.create.mockResolvedValue(mockQuestion)

      // Act
      const result = await assessmentService.addQuestion(assessmentId, questionData)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockQuestionModel.create).toHaveBeenCalledWith({
        ...questionData,
        assessment_id: assessmentId,
      })
      expect(mockQuestionOptionModel.create).not.toHaveBeenCalled()
      expect(result).toEqual(mockQuestion)
    })

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999
      const questionData = {
        question_text: 'Test question',
        question_type: 'multiple_choice',
      }

      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.addQuestion(assessmentId, questionData)).rejects.toThrow(
        'Assessment not found'
      )
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockQuestionModel.create).not.toHaveBeenCalled()
    })
  })

  describe('getAssessmentsForCourse', () => {
    test('should get assessments without questions', async () => {
      // Arrange
      const courseId = 1
      const mockAssessments = [
        { id: 1, title: 'Quiz 1', course_id: courseId },
        { id: 2, title: 'Assignment 1', course_id: courseId },
      ]

      mockCourseModel.findByPk.mockResolvedValue({ id: courseId, name: 'Test Course' })
      mockAssessmentModel.findAll.mockResolvedValue(mockAssessments)

      // Act
      const result = await assessmentService.getAssessmentsForCourse(courseId, false)

      // Assert
      expect(mockAssessmentModel.findAll).toHaveBeenCalledWith({
        where: { course_id: courseId },
        include: [],
      })
      expect(result).toEqual(mockAssessments)
    })

    test('should get assessments with questions', async () => {
      // Arrange
      const courseId = 1
      const mockAssessments = [
        {
          id: 1,
          title: 'Quiz 1',
          course_id: courseId,
          questions: [{ id: 1, question_text: 'Question 1', options: [] }],
        },
      ]

      mockCourseModel.findByPk.mockResolvedValue({ id: courseId, name: 'Test Course' })
      mockAssessmentModel.findAll.mockResolvedValue(mockAssessments)

      // Act
      const result = await assessmentService.getAssessmentsForCourse(courseId, true)

      // Assert
      expect(mockAssessmentModel.findAll).toHaveBeenCalledWith({
        where: { course_id: courseId },
        include: [
          expect.objectContaining({
            model: mockQuestionModel,
            as: 'questions',
          }),
        ],
      })
      expect(result).toEqual(mockAssessments)
    })
  })

  describe('getAssessmentById', () => {
    test('should get assessment without questions', async () => {
      // Arrange
      const assessmentId = 1
      const mockAssessment = { id: assessmentId, title: 'Test Assessment' }

      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.getAssessmentById(assessmentId, false)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId, {
        include: [],
      })
      expect(result).toEqual(mockAssessment)
    })

    test('should get assessment with questions in teacher view', async () => {
      // Arrange
      const assessmentId = 1
      const mockAssessment = {
        id: assessmentId,
        title: 'Test Assessment',
        questions: [
          {
            id: 1,
            question_text: 'Question 1',
            options: [{ id: 1, option_text: 'Option 1', is_correct: true }],
          },
        ],
      }

      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.getAssessmentById(assessmentId, true, true)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalled()
      expect(result).toEqual(mockAssessment)
    })

    test('should get assessment with questions in student view', async () => {
      // Arrange
      const assessmentId = 1
      const mockAssessment = {
        id: assessmentId,
        title: 'Test Assessment',
        questions: [
          {
            id: 1,
            question_text: 'Question 1',
            options: [
              { id: 1, option_text: 'Option 1' }, // No is_correct field
            ],
          },
        ],
      }

      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.getAssessmentById(assessmentId, true, false)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalled()
      expect(result).toEqual(mockAssessment)
    })

    test('should throw error if assessment not found', async () => {
      // Arrange
      const assessmentId = 999
      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.getAssessmentById(assessmentId)).rejects.toThrow(
        'Assessment not found'
      )
    })
  })

  describe('startSubmission', () => {
    test('should create a new submission if none exists', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2

      mockSubmissionModel.findOne.mockResolvedValue(null)

      const mockAssessment = {
        id: assessmentId,
        title: 'Test Assessment',
        max_score: 100,
      }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockSubmission = {
        id: 1,
        assessment_id: assessmentId,
        user_id: userId,
        max_score: 100,
        status: 'in_progress',
      }
      mockSubmissionModel.create.mockResolvedValue(mockSubmission)

      // Act
      const result = await assessmentService.startSubmission(assessmentId, userId)

      // Assert
      expect(mockSubmissionModel.findOne).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
          status: 'in_progress',
        },
      })
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockSubmissionModel.create).toHaveBeenCalledWith({
        assessment_id: assessmentId,
        user_id: userId,
        max_score: 100,
        status: 'in_progress',
      })
      expect(result).toEqual(mockSubmission)
    })

    test('should return existing submission if one exists', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2

      const mockExistingSubmission = {
        id: 1,
        assessment_id: assessmentId,
        user_id: userId,
        status: 'in_progress',
      }
      mockSubmissionModel.findOne.mockResolvedValue(mockExistingSubmission)

      // Act
      const result = await assessmentService.startSubmission(assessmentId, userId)

      // Assert
      expect(mockSubmissionModel.findOne).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
          status: 'in_progress',
        },
      })
      expect(mockAssessmentModel.findByPk).not.toHaveBeenCalled()
      expect(mockSubmissionModel.create).not.toHaveBeenCalled()
      expect(result).toEqual(mockExistingSubmission)
    })

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999
      const userId = 2

      mockSubmissionModel.findOne.mockResolvedValue(null)
      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.startSubmission(assessmentId, userId)).rejects.toThrow(
        'Assessment not found'
      )
      expect(mockSubmissionModel.create).not.toHaveBeenCalled()
    })
  })

  describe('saveAnswer', () => {
    test('should save a new multiple choice answer', async () => {
      // Arrange
      const submissionId = 1
      const questionId = 2
      const answerData = { optionId: 3 }

      const mockSubmission = {
        id: submissionId,
        status: 'in_progress',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockQuestion = {
        id: questionId,
        question_type: 'multiple_choice',
      }
      mockQuestionModel.findByPk.mockResolvedValue(mockQuestion)

      mockAnswerResponseModel.findOne.mockResolvedValue(null)

      const mockAnswer = {
        id: 1,
        submission_id: submissionId,
        question_id: questionId,
        selected_option_id: 3,
        text_response: null,
      }
      mockAnswerResponseModel.create.mockResolvedValue(mockAnswer)

      // Act
      const result = await assessmentService.saveAnswer(submissionId, questionId, answerData)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockQuestionModel.findByPk).toHaveBeenCalledWith(questionId)
      expect(mockAnswerResponseModel.findOne).toHaveBeenCalledWith({
        where: {
          submission_id: submissionId,
          question_id: questionId,
        },
      })
      expect(mockAnswerResponseModel.create).toHaveBeenCalledWith({
        submission_id: submissionId,
        question_id: questionId,
        selected_option_id: 3,
        text_response: null,
      })
      expect(result).toEqual(mockAnswer)
    })

    test('should update an existing answer', async () => {
      // Arrange
      const submissionId = 1
      const questionId = 2
      const answerData = { textResponse: 'Paris' }

      const mockSubmission = {
        id: submissionId,
        status: 'in_progress',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockQuestion = {
        id: questionId,
        question_type: 'short_answer',
      }
      mockQuestionModel.findByPk.mockResolvedValue(mockQuestion)

      const mockExistingAnswer = {
        id: 1,
        submission_id: submissionId,
        question_id: questionId,
        selected_option_id: null,
        text_response: 'Lyon',
        save: jest.fn().mockResolvedValue(true),
      }
      mockAnswerResponseModel.findOne.mockResolvedValue(mockExistingAnswer)

      // Act
      const result = await assessmentService.saveAnswer(submissionId, questionId, answerData)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockQuestionModel.findByPk).toHaveBeenCalledWith(questionId)
      expect(mockExistingAnswer.save).toHaveBeenCalled()
      expect(mockExistingAnswer.text_response).toBe('Paris')
      expect(mockExistingAnswer.selected_option_id).toBeNull()
      expect(result).toEqual(mockExistingAnswer)
    })

    test('should throw error if submission is not in progress', async () => {
      // Arrange
      const submissionId = 1
      const questionId = 2
      const answerData = { optionId: 3 }

      const mockSubmission = {
        id: submissionId,
        status: 'submitted',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Act & Assert
      await expect(
        assessmentService.saveAnswer(submissionId, questionId, answerData)
      ).rejects.toThrow('Cannot modify a submitted assessment')
      expect(mockQuestionModel.findByPk).not.toHaveBeenCalled()
      expect(mockAnswerResponseModel.findOne).not.toHaveBeenCalled()
    })

    test('should validate answer type based on question type', async () => {
      // Arrange
      const submissionId = 1
      const questionId = 2
      const answerData = { textResponse: 'Paris' } // Text response for multiple choice question

      const mockSubmission = {
        id: submissionId,
        status: 'in_progress',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockQuestion = {
        id: questionId,
        question_type: 'multiple_choice', // Multiple choice requires optionId
      }
      mockQuestionModel.findByPk.mockResolvedValue(mockQuestion)

      // Act & Assert
      await expect(
        assessmentService.saveAnswer(submissionId, questionId, answerData)
      ).rejects.toThrow('Invalid answer format for question type multiple_choice')
    })

    test('should throw error if submission not found', async () => {
      // Arrange
      const submissionId = 999
      const questionId = 1
      const answerData = { optionId: 5 }

      mockSubmissionModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(
        assessmentService.saveAnswer(submissionId, questionId, answerData)
      ).rejects.toThrow('Submission not found')
    })
  })

  describe('submitAssessment', () => {
    test('should submit a quiz and auto-grade multiple choice questions', async () => {
      // Arrange
      const submissionId = 1
      const userId = 2

      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        assessment_id: 5,
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockAssessment = {
        id: 5,
        type: 'quiz',
        due_date: null,
      }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockAnswers = [
        {
          id: 1,
          selected_option_id: 10,
          question: {
            id: 3,
            question_type: 'multiple_choice',
            points: 5,
            options: [{ id: 10, is_correct: true }],
          },
          save: jest.fn().mockResolvedValue(true),
        },
        {
          id: 2,
          selected_option_id: 20,
          question: {
            id: 4,
            question_type: 'multiple_choice',
            points: 5,
            options: [], // No matching correct option
          },
          save: jest.fn().mockResolvedValue(true),
        },
      ]
      mockAnswerResponseModel.findAll.mockResolvedValue(mockAnswers)

      // Act
      const result = await assessmentService.submitAssessment(submissionId, userId)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(5)
      expect(mockAnswerResponseModel.findAll).toHaveBeenCalled()
      expect(mockAnswers[0].points_awarded).toBe(5) // Correct answer
      expect(mockAnswers[1].points_awarded).toBe(0) // Incorrect answer
      expect(mockAnswers[0].save).toHaveBeenCalled()
      expect(mockAnswers[1].save).toHaveBeenCalled()
      expect(mockSubmission.status).toBe('graded')
      expect(mockSubmission.score).toBe(5) // Only the first answer was correct
      expect(mockSubmission.save).toHaveBeenCalled()
      expect(result).toEqual(mockSubmission)
    })

    test('should submit an assignment without auto-grading', async () => {
      // Arrange
      const submissionId = 1
      const userId = 2

      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        assessment_id: 5,
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockAssessment = {
        id: 5,
        type: 'assignment',
        due_date: null,
      }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.submitAssessment(submissionId, userId)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(5)
      expect(mockAnswerResponseModel.findAll).not.toHaveBeenCalled()
      expect(mockSubmission.status).toBe('submitted') // Not auto-graded
      expect(mockSubmission.save).toHaveBeenCalled()
      expect(result).toEqual(mockSubmission)
    })

    test('should detect late submissions', async () => {
      // Arrange
      const submissionId = 1
      const userId = 2

      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        assessment_id: 5,
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1) // Yesterday

      const mockAssessment = {
        id: 5,
        type: 'assignment',
        due_date: pastDate.toISOString(),
      }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.submitAssessment(submissionId, userId)

      // Assert
      expect(mockSubmission.is_late).toBe(true)
      expect(mockSubmission.save).toHaveBeenCalled()
    })

    test('should throw error for unauthorized user', async () => {
      // Arrange
      const submissionId = 1
      const userId = 999 // Different from submission user

      const mockSubmission = {
        id: submissionId,
        user_id: 2, // Different from userId
        status: 'in_progress',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Act & Assert
      await expect(assessmentService.submitAssessment(submissionId, userId)).rejects.toThrow(
        'Unauthorized submission'
      )
      expect(mockAssessmentModel.findByPk).not.toHaveBeenCalled()
    })

    test('should throw error if already submitted', async () => {
      // Arrange
      const submissionId = 1
      const userId = 2

      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        status: 'submitted', // Already submitted
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Act & Assert
      await expect(assessmentService.submitAssessment(submissionId, userId)).rejects.toThrow(
        'Assessment already submitted'
      )
      expect(mockAssessmentModel.findByPk).not.toHaveBeenCalled()
    })
  })

  describe('getSubmissionsForAssessment', () => {
    test('should get all submissions for an assessment', async () => {
      // Arrange
      const assessmentId = 1

      const mockSubmissions = [
        { id: 1, assessment_id: assessmentId, user_id: 2, status: 'graded' },
        { id: 2, assessment_id: assessmentId, user_id: 3, status: 'in_progress' },
      ]
      mockSubmissionModel.findAll.mockResolvedValue(mockSubmissions)

      // Act
      const result = await assessmentService.getSubmissionsForAssessment(assessmentId)

      // Assert
      expect(mockSubmissionModel.findAll).toHaveBeenCalledWith({
        where: { assessment_id: assessmentId },
        include: [
          expect.objectContaining({
            model: mockUserModel,
            as: 'user',
          }),
        ],
      })
      expect(result).toEqual(mockSubmissions)
    })

    test('should return empty array if no submissions exist', async () => {
      // Arrange
      const assessmentId = 1
      mockSubmissionModel.findAll.mockResolvedValue([])

      // Act
      const result = await assessmentService.getSubmissionsForAssessment(assessmentId)

      // Assert
      expect(result).toEqual([])
      expect(mockSubmissionModel.findAll).toHaveBeenCalledWith({
        where: { assessment_id: assessmentId },
        include: [expect.anything()],
      })
    })
  })

  describe('getStudentSubmission', () => {
    test('should get student submission with answers', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2

      const mockSubmission = {
        id: 3,
        assessment_id: assessmentId,
        user_id: userId,
        status: 'submitted',
        answers: [{ id: 1, question_id: 5, text_response: 'Test answer' }],
      }
      mockSubmissionModel.findOne.mockResolvedValue(mockSubmission)

      // Act
      const result = await assessmentService.getStudentSubmission(assessmentId, userId, true)

      // Assert
      expect(mockSubmissionModel.findOne).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
        },
        include: [
          expect.objectContaining({
            model: mockAnswerResponseModel,
            as: 'answers',
          }),
        ],
      })
      expect(result).toEqual(mockSubmission)
    })

    test('should get student submission without answers', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2

      const mockSubmission = {
        id: 3,
        assessment_id: assessmentId,
        user_id: userId,
        status: 'submitted',
      }
      mockSubmissionModel.findOne.mockResolvedValue(mockSubmission)

      // Act
      const result = await assessmentService.getStudentSubmission(assessmentId, userId, false)

      // Assert
      expect(mockSubmissionModel.findOne).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
        },
        include: [],
      })
      expect(result).toEqual(mockSubmission)
    })

    test('should return null if student has no submission', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2
      mockSubmissionModel.findOne.mockResolvedValue(null)

      // Act
      const result = await assessmentService.getStudentSubmission(assessmentId, userId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('gradeSubmission', () => {
    test('should grade a submission successfully', async () => {
      // Arrange
      const submissionId = 1
      const grades = [
        { questionId: 5, points: 10, feedback: 'Great job!' },
        { questionId: 6, points: 5, feedback: 'Partially correct' },
      ]
      const feedback = 'Overall good work'

      const mockSubmission = {
        id: submissionId,
        status: 'submitted',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      const mockAnswer1 = {
        question_id: 5,
        save: jest.fn().mockResolvedValue(true),
      }
      const mockAnswer2 = {
        question_id: 6,
        save: jest.fn().mockResolvedValue(true),
      }

      mockAnswerResponseModel.findOne
        .mockResolvedValueOnce(mockAnswer1)
        .mockResolvedValueOnce(mockAnswer2)

      // Act
      const result = await assessmentService.gradeSubmission(submissionId, grades, feedback)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAnswerResponseModel.findOne).toHaveBeenCalledTimes(2)
      expect(mockAnswer1.points_awarded).toBe(10)
      expect(mockAnswer1.feedback).toBe('Great job!')
      expect(mockAnswer1.save).toHaveBeenCalled()
      expect(mockAnswer2.points_awarded).toBe(5)
      expect(mockAnswer2.feedback).toBe('Partially correct')
      expect(mockAnswer2.save).toHaveBeenCalled()
      expect(mockSubmission.score).toBe(15)
      expect(mockSubmission.feedback).toBe('Overall good work')
      expect(mockSubmission.status).toBe('graded')
      expect(mockSubmission.save).toHaveBeenCalled()
      expect(result).toEqual(mockSubmission)
    })

    test('should skip missing answers when grading', async () => {
      // Arrange
      const submissionId = 1
      const grades = [
        { questionId: 5, points: 10, feedback: 'Great job!' },
        { questionId: 999, points: 5, feedback: 'This question does not exist' }, // Non-existent question
      ]
      const feedback = 'Overall good work'

      const mockSubmission = {
        id: submissionId,
        status: 'submitted',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Only one answer exists
      const mockAnswer = {
        question_id: 5,
        save: jest.fn().mockResolvedValue(true),
      }

      mockAnswerResponseModel.findOne
        .mockResolvedValueOnce(mockAnswer) // First question exists
        .mockResolvedValueOnce(null) // Second question doesn't exist

      // Act
      const result = await assessmentService.gradeSubmission(submissionId, grades, feedback)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAnswerResponseModel.findOne).toHaveBeenCalledTimes(2)
      expect(mockAnswer.points_awarded).toBe(10)
      expect(mockAnswer.feedback).toBe('Great job!')
      expect(mockAnswer.save).toHaveBeenCalled()
      // Total score should only include points from the existing answer
      expect(mockSubmission.score).toBe(10)
      expect(mockSubmission.feedback).toBe('Overall good work')
      expect(mockSubmission.status).toBe('graded')
      expect(mockSubmission.save).toHaveBeenCalled()
      expect(result).toEqual(mockSubmission)
    })

    test('should throw error if submission not found', async () => {
      // Arrange
      const submissionId = 999
      const grades = [{ questionId: 1, points: 5 }]

      mockSubmissionModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.gradeSubmission(submissionId, grades)).rejects.toThrow(
        'Submission not found'
      )
      expect(mockAnswerResponseModel.findOne).not.toHaveBeenCalled()
    })

    test('should handle empty grades array', async () => {
      // Arrange
      const submissionId = 1
      const grades = []
      const feedback = 'No grades provided'

      const mockSubmission = {
        id: submissionId,
        status: 'submitted',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Act
      const result = await assessmentService.gradeSubmission(submissionId, grades, feedback)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAnswerResponseModel.findOne).not.toHaveBeenCalled()
      expect(mockSubmission.score).toBe(0)
      expect(mockSubmission.feedback).toBe('No grades provided')
      expect(mockSubmission.status).toBe('graded')
      expect(mockSubmission.save).toHaveBeenCalled()
      expect(result).toEqual(mockSubmission)
    })
  })
})

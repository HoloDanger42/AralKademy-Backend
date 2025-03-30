import { jest } from '@jest/globals'
import {
  createAssessment,
  getAssessmentById,
  getAssessmentsForModule,
  addQuestion,
  startSubmission,
  saveAnswer,
  submitAssessment,
  getSubmissionsForAssessment,
  getStudentSubmissions,
  getStudentSubmission,
  gradeSubmission,
} from '../../../src/controllers/assessmentController.js'
import AssessmentService from '../../../src/services/assessmentService.js'
import { log } from '../../../src/utils/logger.js'

describe('Assessment Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, role: 'teacher' },
    }

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    // Setup spies
    jest.spyOn(log, 'error')
    jest.spyOn(log, 'info')

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('createAssessment', () => {
    test('should create assessment successfully', async () => {
      // Arrange
      mockReq.body = {
        title: 'Test Assessment',
        course_id: 1,
        type: 'quiz',
      }

      const mockAssessment = { id: 1, ...mockReq.body }
      jest.spyOn(AssessmentService.prototype, 'createAssessment').mockResolvedValue(mockAssessment)

      // Act
      await createAssessment(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.createAssessment).toHaveBeenCalledWith(mockReq.body)
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        assessment: mockAssessment,
      })
    })

    test('should handle errors when creating assessment fails', async () => {
      // Arrange
      mockReq.body = {
        title: 'Test Assessment',
        course_id: 1,
        type: 'quiz',
      }

      const error = new Error('Creation failed')
      jest.spyOn(AssessmentService.prototype, 'createAssessment').mockRejectedValue(error)

      // Act
      await createAssessment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error creating assessment',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAssessmentById', () => {
    test('should get assessment by ID successfully', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId
      mockReq.query.includeQuestions = 'true'
      mockReq.query.teacherView = 'true'

      const mockAssessment = {
        id: 1,
        title: 'Test Assessment',
        questions: [{ id: 1, question_text: 'Sample question' }],
      }

      jest.spyOn(AssessmentService.prototype, 'getAssessmentById').mockResolvedValue(mockAssessment)

      // Act
      await getAssessmentById(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.getAssessmentById).toHaveBeenCalledWith(
        assessmentId,
        true,
        true
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        assessment: mockAssessment,
      })
    })

    test('should handle assessment not found', async () => {
      // Arrange
      mockReq.params.assessmentId = '999'

      const error = new Error('Assessment not found')
      jest.spyOn(AssessmentService.prototype, 'getAssessmentById').mockRejectedValue(error)

      // Act
      await getAssessmentById(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getAssessmentsForModule', () => {
    test('should get all assessments for a module successfully', async () => {
      // Arrange
      const moduleId = '1'
      mockReq.params.moduleId = moduleId
      mockReq.query.includeQuestions = 'true'

      const mockAssessments = [
        { id: 1, title: 'Quiz 1', module_id: 1 },
        { id: 2, title: 'Assignment 1', module_id: 1 },
      ]

      jest
        .spyOn(AssessmentService.prototype, 'getAssessmentsForModule')
        .mockResolvedValue(mockAssessments)

      // Act
      await getAssessmentsForModule(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.getAssessmentsForModule).toHaveBeenCalledWith(
        moduleId,
        true
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        assessments: mockAssessments,
      })
    })

    test('should handle module not found', async () => {
      // Arrange
      mockReq.params.moduleId = '999'

      const error = new Error('Module not found')
      jest.spyOn(AssessmentService.prototype, 'getAssessmentsForModule').mockRejectedValue(error)

      // Act
      await getAssessmentsForModule(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Module not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('addQuestion', () => {
    test('should add a question to an assessment successfully', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId
      mockReq.body = {
        question_text: 'What is the capital of France?',
        question_type: 'multiple_choice',
        points: 5,
        options: [
          { text: 'Paris', is_correct: true },
          { text: 'London', is_correct: false },
          { text: 'Berlin', is_correct: false },
        ],
      }

      const mockQuestion = { id: 1, assessment_id: 1, ...mockReq.body }
      jest.spyOn(AssessmentService.prototype, 'addQuestion').mockResolvedValue(mockQuestion)

      // Act
      await addQuestion(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.addQuestion).toHaveBeenCalledWith(
        assessmentId,
        mockReq.body
      )
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        question: mockQuestion,
      })
    })

    test('should handle assessment not found when adding question', async () => {
      // Arrange
      mockReq.params.assessmentId = '999'
      mockReq.body = {
        question_text: 'Test question',
        question_type: 'multiple_choice',
      }

      const error = new Error('Assessment not found')
      jest.spyOn(AssessmentService.prototype, 'addQuestion').mockRejectedValue(error)

      // Act
      await addQuestion(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('startSubmission', () => {
    test('should start a submission successfully', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId
      mockReq.user.id = 1

      const mockSubmission = {
        id: 1,
        assessment_id: 1,
        user_id: 1,
        status: 'in_progress',
      }
      jest.spyOn(AssessmentService.prototype, 'startSubmission').mockResolvedValue(mockSubmission)

      // Act
      await startSubmission(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.startSubmission).toHaveBeenCalledWith(
        assessmentId,
        mockReq.user.id
      )
      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submission: mockSubmission,
      })
    })

    test('should handle assessment not found when starting submission', async () => {
      // Arrange
      mockReq.params.assessmentId = '999'

      const error = new Error('Assessment not found')
      jest.spyOn(AssessmentService.prototype, 'startSubmission').mockRejectedValue(error)

      // Act
      await startSubmission(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('saveAnswer', () => {
    test('should save an answer successfully', async () => {
      // Arrange
      const submissionId = '1'
      const questionId = '2'
      mockReq.params.submissionId = submissionId
      mockReq.params.questionId = questionId
      mockReq.body = { optionId: 3 }

      const mockAnswer = {
        id: 1,
        submission_id: 1,
        question_id: 2,
        selected_option_id: 3,
      }
      jest.spyOn(AssessmentService.prototype, 'saveAnswer').mockResolvedValue(mockAnswer)

      // Act
      await saveAnswer(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.saveAnswer).toHaveBeenCalledWith(
        submissionId,
        questionId,
        mockReq.body
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        answer: mockAnswer,
      })
    })

    test('should handle submission not found when saving answer', async () => {
      // Arrange
      mockReq.params.submissionId = '999'
      mockReq.params.questionId = '1'
      mockReq.body = { textResponse: 'Test answer' }

      const error = new Error('Submission not found')
      jest.spyOn(AssessmentService.prototype, 'saveAnswer').mockRejectedValue(error)

      // Act
      await saveAnswer(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Submission not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('submitAssessment', () => {
    test('should submit assessment successfully', async () => {
      // Arrange
      const submissionId = '1'
      mockReq.params.submissionId = submissionId
      mockReq.user.id = 1

      const mockSubmission = {
        id: 1,
        status: 'graded',
        score: 80,
      }
      jest.spyOn(AssessmentService.prototype, 'submitAssessment').mockResolvedValue(mockSubmission)

      // Act
      await submitAssessment(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.submitAssessment).toHaveBeenCalledWith(
        submissionId,
        mockReq.user.id
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submission: mockSubmission,
      })
    })

    test('should handle unauthorized submission', async () => {
      // Arrange
      mockReq.params.submissionId = '1'
      mockReq.user.id = 999

      const error = new Error('Unauthorized submission')
      jest.spyOn(AssessmentService.prototype, 'submitAssessment').mockRejectedValue(error)

      // Act
      await submitAssessment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'Unauthorized submission',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getSubmissionsForAssessment', () => {
    test('should get all submissions for an assessment', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId

      const mockSubmissions = [
        { id: 1, user_id: 1, status: 'graded', score: 90 },
        { id: 2, user_id: 2, status: 'submitted' },
      ]
      jest
        .spyOn(AssessmentService.prototype, 'getSubmissionsForAssessment')
        .mockResolvedValue(mockSubmissions)

      // Act
      await getSubmissionsForAssessment(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.getSubmissionsForAssessment).toHaveBeenCalledWith(
        assessmentId
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submissions: mockSubmissions,
      })
    })

    test('should handle assessment not found when getting submissions', async () => {
      // Arrange
      mockReq.params.assessmentId = '999'

      const error = new Error('Assessment not found')
      jest
        .spyOn(AssessmentService.prototype, 'getSubmissionsForAssessment')
        .mockRejectedValue(error)

      // Act
      await getSubmissionsForAssessment(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Assessment not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })

  describe('getStudentSubmissions', () => {
    test('should get a student submissions successfully', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId
      mockReq.user.id = 1
      mockReq.query.includeAnswers = 'true'

      const mockSubmission = {
        id: 1,
        assessment_id: 1,
        user_id: 1,
        status: 'graded',
        answers: [{ id: 1, question_id: 1, selected_option_id: 2 }],
      }
      jest
        .spyOn(AssessmentService.prototype, 'getStudentSubmissions')
        .mockResolvedValue([mockSubmission])

      // Act
      await getStudentSubmissions(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.getStudentSubmissions).toHaveBeenCalledWith(
        assessmentId,
        mockReq.user.id,
        true
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submissions: [mockSubmission],
      })
    })

    test('should return null if student has no submissions', async () => {
      // Arrange
      mockReq.params.assessmentId = '1'
      mockReq.user.id = 999

      jest.spyOn(AssessmentService.prototype, 'getStudentSubmissions').mockResolvedValue(null)

      // Act
      await getStudentSubmissions(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submissions: null,
      })
    })
  })

  describe('getStudentSubmission', () => {
    test('should get a student submission successfully', async () => {
      // Arrange
      const assessmentId = '1'
      mockReq.params.assessmentId = assessmentId
      mockReq.user.id = 1
      mockReq.query.includeAnswers = 'true'

      const mockSubmission = {
        id: 1,
        assessment_id: 1,
        user_id: 1,
        status: 'graded',
        answers: [{ id: 1, question_id: 1, selected_option_id: 2 }],
      }
      jest
        .spyOn(AssessmentService.prototype, 'getStudentSubmission')
        .mockResolvedValue(mockSubmission)

      // Act
      await getStudentSubmission(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.getStudentSubmission).toHaveBeenCalledWith(
        assessmentId,
        mockReq.user.id,
        true
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submission: mockSubmission,
      })
    })

    test('should return null if student has no submission', async () => {
      // Arrange
      mockReq.params.assessmentId = '1'
      mockReq.user.id = 999

      jest.spyOn(AssessmentService.prototype, 'getStudentSubmission').mockResolvedValue(null)

      // Act
      await getStudentSubmission(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submission: null,
      })
    })
  })

  describe('gradeSubmission', () => {
    test('should grade a submission successfully', async () => {
      // Arrange
      const submissionId = '1'
      mockReq.params.submissionId = submissionId
      mockReq.body = {
        grades: [
          { questionId: 1, points: 5, feedback: 'Good job!' },
          { questionId: 2, points: 3, feedback: 'Partially correct' },
        ],
        feedback: 'Overall good work',
      }

      const mockSubmission = {
        id: 1,
        status: 'graded',
        score: 8,
        feedback: 'Overall good work',
      }
      jest.spyOn(AssessmentService.prototype, 'gradeSubmission').mockResolvedValue(mockSubmission)

      // Act
      await gradeSubmission(mockReq, mockRes)

      // Assert
      expect(AssessmentService.prototype.gradeSubmission).toHaveBeenCalledWith(
        submissionId,
        mockReq.body.grades,
        mockReq.body.feedback
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        submission: mockSubmission,
      })
    })

    test('should handle submission not found when grading', async () => {
      // Arrange
      mockReq.params.submissionId = '999'
      mockReq.body = {
        grades: [{ questionId: 1, points: 5 }],
        feedback: 'Good work',
      }

      const error = new Error('Submission not found')
      jest.spyOn(AssessmentService.prototype, 'gradeSubmission').mockRejectedValue(error)

      // Act
      await gradeSubmission(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'NOT_FOUND',
          message: 'Submission not found',
        },
      })
      expect(log.error).toHaveBeenCalled()
    })
  })
})

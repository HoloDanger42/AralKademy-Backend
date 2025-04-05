import { jest } from '@jest/globals'
import AssessmentService from '../../../src/services/assessmentService.js'
import { Op } from 'sequelize'

describe('Assessment Service', () => {
  let assessmentService
  let mockAssessmentModel
  let mockQuestionModel
  let mockQuestionOptionModel
  let mockSubmissionModel
  let mockAnswerResponseModel
  let mockModuleModel
  let mockUserModel

  beforeEach(() => {
    mockAssessmentModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
    }

    mockQuestionModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn(),
      sum: jest.fn(),
    }

    mockQuestionOptionModel = {
      create: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
    }

    mockSubmissionModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    }

    mockAnswerResponseModel = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      sum: jest.fn()
    }

    mockModuleModel = {
      findByPk: jest.fn(),
    }

    mockUserModel = {}

    assessmentService = new AssessmentService(
      mockAssessmentModel,
      mockQuestionModel,
      mockQuestionOptionModel,
      mockSubmissionModel,
      mockAnswerResponseModel,
      mockModuleModel,
      mockUserModel,
    )
  })

  describe('createAssessment', () => {
    test('should create an assessment successfully', async () => {
      // Arrange
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test description',
        module_id: 1,
        type: 'quiz',
        allowed_attempts: 2
      }

      const moduleData = {
        module_id: 1,
        course_id: 2
      }

      const expectedAssessment = { id: 1, ...assessmentData }
      mockModuleModel.findByPk.mockResolvedValue({ id: 1, course_id: 2 })
      mockAssessmentModel.create.mockResolvedValue(expectedAssessment)

      // Act
      const result = await assessmentService.createAssessment(assessmentData)

      // Assert
      expect(mockModuleModel.findByPk).toHaveBeenCalledWith(1)
      expect(mockAssessmentModel.create).toHaveBeenCalledWith(assessmentData)
      expect(result).toEqual({
        assessment: expectedAssessment,
        course_id: moduleData.course_id,
      })
    })

    test('should throw error if module does not exist', async () => {
      // Arrange
      const assessmentData = {
        title: 'Test Assessment',
        description: 'Test description',
        module_id: 999, 
        type: 'quiz',
        allowed_attempts: 2
      }

      mockModuleModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.createAssessment(assessmentData)).rejects.toThrow(
        'Module not found'
      )
      expect(mockModuleModel.findByPk).toHaveBeenCalledWith(999)
      expect(mockAssessmentModel.create).not.toHaveBeenCalled()
    })

    test('should throw an error if allowed_attempts is 0 or negative', async () => {
      // Arrange
      const assessmentData = {
        title: 'Invalid Assessment',
        description: 'Should fail',
        module_id: 1,
        type: 'quiz',
        allowed_attempts: 0
      }
  
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
  
      // Act & Assert
      await expect(assessmentService.createAssessment(assessmentData)).rejects.toThrow(
        'Invalid allowed attempts'
      )
  
      expect(mockModuleModel.findByPk).toHaveBeenCalledWith(1)
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

  describe('getAssessmentsForModule', () => {
    test('should get assessments without questions', async () => {
      // Arrange
      const mockAssessments = [
        { id: 1, title: 'Quiz 1', module_id: 1 },
        { id: 2, title: 'Assignment 1', module_id: 1 },
      ]

      const moduleData = {
        module_id: 1,
        course_id: 2
      }

      mockModuleModel.findByPk.mockResolvedValue({ id: moduleData.module_id, name: 'Test Module', course_id: moduleData.course_id })
      mockAssessmentModel.findAll.mockResolvedValue(mockAssessments)

      // Act
      const result = await assessmentService.getAssessmentsForModule(moduleData.module_id, false)

      // Assert
      expect(mockAssessmentModel.findAll).toHaveBeenCalledWith({
        where: { module_id: moduleData.module_id },
        include: [],
      })
      expect(result.assessments).toEqual(mockAssessments)
    })

    test('should get assessments with questions', async () => {
      // Arrange
      const mockAssessments = [
        {
          id: 1,
          title: 'Quiz 1',
          module_id: 1,
          questions: [{ id: 1, question_text: 'Question 1', options: [] }],
        },
      ]

      const moduleData = {
        module_id: 1,
        course_id: 2
      }

      mockModuleModel.findByPk.mockResolvedValue({ id: moduleData.module_id, name: 'Test Module', course_id: moduleData.course_id })
      mockAssessmentModel.findAll.mockResolvedValue(mockAssessments)

      // Act
      const result = await assessmentService.getAssessmentsForModule(moduleData.module_id, true)

      // Assert
      expect(mockAssessmentModel.findAll).toHaveBeenCalledWith({
        where: { module_id: moduleData.module_id },
        include: [
          expect.objectContaining({
            model: mockQuestionModel,
            as: 'questions',
          }),
        ],
      })
      expect(result.assessments).toEqual(mockAssessments)
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
    test('should submit an assessment and auto-grade multiple choice questions', async () => {
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

    test('should submit an assessment without auto-grading', async () => {
      // Arrange
      const submissionId = 1;
      const userId = 2;
    
      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        assessment_id: 5,
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission);
    
      const mockAssessment = {
        id: 5,
        type: 'quiz',
        due_date: null,
      };
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment);
    
      const mockAnswers = [
        {
          id: 1,
          selected_option_id: 10,
          question: {
            id: 3,
            question_type: 'short_answer',
            points: 5,
            options: [], // No options for short answer
          },
          points_awarded: null,
          save: jest.fn().mockResolvedValue(true),
        },
        {
          id: 2,
          selected_option_id: 20,
          question: {
            id: 4,
            question_type: 'essay',
            points: 5,
            options: [], // No options for essay
          },
          points_awarded: null,
          save: jest.fn().mockResolvedValue(true),
        },
      ];
      mockAnswerResponseModel.findAll.mockResolvedValue(mockAnswers);
    
      // Act
      const result = await assessmentService.submitAssessment(submissionId, userId);
    
      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId);
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(5);
      expect(mockAnswerResponseModel.findAll).toHaveBeenCalled();
      expect(mockAnswers[0].points_awarded).toBeNull(); // Short answer not graded
      expect(mockAnswers[1].points_awarded).toBeNull(); // Essay not graded
      expect(mockSubmission.status).toBe('submitted');
      expect(mockSubmission.score).toBe(0); // No points awarded for non-multiple-choice questions
      expect(mockSubmission.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubmission);
    });    

    test('should detect late submissions', async () => {
      // Arrange
      const submissionId = 1;
      const userId = 2;
    
      const mockSubmission = {
        id: submissionId,
        user_id: userId,
        assessment_id: 5,
        status: 'in_progress',
        save: jest.fn().mockResolvedValue(true),
      };
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission);
    
      const mockAssessment = {
        id: 5,
        type: 'quiz',
        due_date: '2025-04-01T00:00:00Z', // Due date in the past
      };
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment);
    
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
      ];
      mockAnswerResponseModel.findAll.mockResolvedValue(mockAnswers);
    
      // Act
      const result = await assessmentService.submitAssessment(submissionId, userId);
    
      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId);
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(5);
      expect(mockAnswerResponseModel.findAll).toHaveBeenCalled();
      expect(mockSubmission.is_late).toBe(true); // Should be marked as late
      expect(mockSubmission.status).toBe('graded');
      expect(mockSubmission.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubmission);
    });    

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
          {
            model: mockAnswerResponseModel,
            as: 'answers',
            include: [
              {
                model: mockQuestionModel,
                as: 'question',
              },
              {
                model: mockQuestionOptionModel,
                as: 'selected_option',
              },
            ],
          },
        ],
        order: [
          ['status', 'DESC'],
          ['submit_time', 'DESC'],
          ['start_time', 'DESC'],
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
        order: [
          ['status', 'DESC'],
          ['submit_time', 'DESC'],
          ['start_time', 'DESC'],
        ],
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

  describe('getStudentSubmissions', () => {
    test('should get student submissions with answers', async () => {
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
      mockSubmissionModel.findAll.mockResolvedValue(mockSubmission)

      // Act
      const results = await assessmentService.getStudentSubmissions(assessmentId, userId, true)

      // Assert
      expect(mockSubmissionModel.findAll).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
        },
        include: [
          {
            model: mockAnswerResponseModel,
            as: 'answers',
            include: [
              {
                model: mockQuestionModel,
                as: 'question',
              },
              {
                model: mockQuestionOptionModel,
                as: 'selected_option',
              },
            ],
          },
        ],
      })
      expect(results).toEqual(mockSubmission)
    })

    test('should get student submissions without answers', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2

      const mockSubmission = {
        id: 3,
        assessment_id: assessmentId,
        user_id: userId,
        status: 'submitted',
      }
      mockSubmissionModel.findAll.mockResolvedValue(mockSubmission)

      // Act
      const results = await assessmentService.getStudentSubmissions(assessmentId, userId, false)

      // Assert
      expect(mockSubmissionModel.findAll).toHaveBeenCalledWith({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
        },
        include: [],
      })
      expect(results).toEqual(mockSubmission)
    })

    test('should return null if student has no submission', async () => {
      // Arrange
      const assessmentId = 1
      const userId = 2
      mockSubmissionModel.findAll.mockResolvedValue(null)

      // Act
      const results = await assessmentService.getStudentSubmissions(assessmentId, userId)

      // Assert
      expect(results).toBeNull()
    })
  })

  describe('gradeSubmission', () => {
    test('should grade a submission successfully', async () => {
      // Arrange
      const submissionId = 1;
      const grade = { questionId: 5, points: 10, feedback: 'Great job!' };
      const feedback = 'Overall good work';
    
      const mockSubmission = {
        id: submissionId,
        status: 'submitted',
        score: 0,
        feedback: null,
        save: jest.fn().mockResolvedValue(true),
      };
    
      const mockQuestion = {
        id: 5,
        points: 20, // Question is worth 20 points
        question_type: 'short_answer'
      };
    
      const mockAnswer = {
        id: 1,
        question_id: 5,
        question: mockQuestion, // Include the question object
        points_awarded: null,
        feedback: null,
        save: jest.fn().mockResolvedValue(true),
      };
    
      // Mock database calls
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission);
      mockAnswerResponseModel.findOne.mockResolvedValue(mockAnswer);
      mockAnswerResponseModel.sum.mockResolvedValue(10);
      mockAnswerResponseModel.count
        .mockResolvedValueOnce(1) // totalAnswers
        .mockResolvedValueOnce(1); // gradedAnswers
    
      // Act
      const result = await assessmentService.gradeSubmission(submissionId, grade, feedback);
    
      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId);
      expect(mockAnswerResponseModel.findOne).toHaveBeenCalledWith({
        where: {
          submission_id: submissionId,
          question_id: grade.questionId,
        },
        include: expect.anything(), // Verify the include is correct
      });
      
      // Verify grading logic
      expect(mockAnswer.points_awarded).toBe(10);
      expect(mockAnswer.feedback).toBe('Great job!');
      expect(mockAnswer.save).toHaveBeenCalled();
      
      // Verify submission updates
      expect(mockSubmission.score).toBe(10);
      expect(mockSubmission.feedback).toBe('Overall good work');
      expect(mockSubmission.status).toBe('graded');
      expect(mockSubmission.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubmission);
    });

    test('should skip missing answers when grading', async () => {
      // Arrange
      const submissionId = 1
      const grade = [
        { questionId: 5, points: 10, feedback: 'Great job!' },
      ]
      const feedback = 'Overall good work'

      const mockSubmission = {
        id: submissionId,
        score: 0,
        status: 'submitted',
        save: jest.fn().mockResolvedValue(true),
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      mockAnswerResponseModel.findOne
        .mockResolvedValueOnce(null) // First question exists

      mockAnswerResponseModel.sum = jest.fn().mockResolvedValue(0);

      // Act
      const result = await assessmentService.gradeSubmission(submissionId, grade, feedback)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId)
      expect(mockAnswerResponseModel.findOne).toHaveBeenCalledTimes(1)
      // Total score should only include points from the existing answer
      expect(mockSubmission.score).toBe(0)
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
  })

  describe('updateAssessment', () => {
    test('should update an assessment successfully', async () => {
      // Arrange
      const assessmentId = 1
      const updateData = {
        title: 'Updated Assessment Title',
        description: 'Updated description',
        duration_minutes: 60,
        allowed_attempts: 2
      }

      const mockAssessment = {
        id: 1,
        title: 'Original Title',
        description: 'Original description',
        duration_minutes: 45,
        allowed_attempts: 2,
        save: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockImplementation(function (data) {
          // Update the mock assessment properties
          Object.assign(this, data)
          return Promise.resolve(this)
        }),
      }

      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      const result = await assessmentService.updateAssessment(assessmentId, updateData)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockAssessment.title).toBe('Updated Assessment Title')
      expect(mockAssessment.description).toBe('Updated description')
      expect(mockAssessment.duration_minutes).toBe(60)
      expect(mockAssessment.update).toHaveBeenCalledWith(updateData)
      expect(result).toEqual(mockAssessment)
    })

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999
      const updateData = { title: 'Updated Title' }

      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.updateAssessment(assessmentId, updateData)).rejects.toThrow(
        'Assessment not found'
      )
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
    })

    test('should throw an error if allowed_attempts is 0 or negative', async () => {
      // Arrange
      const assessmentId = 1; // Provide a valid assessment ID
      const assessmentData = {
        title: 'Invalid Assessment',
        description: 'Should fail',
        type: 'quiz',
        allowed_attempts: 0 // Invalid value
      };
    
      // Mock that the assessment exists (to avoid "Assessment not found" error)
      mockAssessmentModel.findByPk.mockResolvedValue({
        id: assessmentId,
        title: 'Existing Assessment',
        description: 'Some description',
        type: 'quiz',
        allowed_attempts: 3, // Existing valid attempts
      });
    
      // Act & Assert
      await expect(assessmentService.updateAssessment(assessmentId, assessmentData))
        .rejects.toThrow('Invalid allowed attempts');
    
        expect(mockAssessmentModel.update).not.toHaveBeenCalled()
    });
  })

  describe('deleteAssessment', () => {
    test('should delete an assessment successfully', async () => {
      // Arrange
      const assessmentId = 1

      const mockAssessment = {
        id: assessmentId,
        destroy: jest.fn().mockResolvedValue(true),
      }

      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Act
      await assessmentService.deleteAssessment(assessmentId)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockAssessment.destroy).toHaveBeenCalled()
    })

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999

      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.deleteAssessment(assessmentId)).rejects.toThrow(
        'Assessment not found'
      )
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
    })
  })

  describe('updateQuestion', () => {
    /* test('should update a question successfully', async () => {
      // Arrange
      const assessmentId = 1
      const questionId = 2
      const updateData = {
        question_text: 'Updated question text',
        points: 10,
        options: [{ id: 5, option_text: 'Updated option', is_correct: true }],
      }

      const mockAssessment = { id: assessmentId }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      // Create the mock option with a Jest function
      const mockOptionSave = jest.fn().mockResolvedValue(true)
      const mockOption = {
        id: 5,
        option_text: 'Original option',
        is_correct: false,
        save: mockOptionSave,
      }

      const mockQuestion = {
        id: questionId,
        assessment_id: assessmentId,
        question_text: 'Original question',
        question_type: 'multiple_choice',
        points: 5,
        options: [mockOption],
        update: jest.fn().mockImplementation(function (data) {
          Object.assign(this, data)
          return Promise.resolve(this)
        }),
      }

      mockQuestionModel.findOne = jest.fn().mockImplementation(() => {
        // When options are updated in the service, this will call save on our mockOption
        updateData.options.forEach((optionData) => {
          if (optionData.id === mockOption.id) {
            Object.assign(mockOption, optionData)
            mockOption.save()
          }
        })
        return Promise.resolve(mockQuestion)
      })

      mockQuestionModel.findByPk.mockResolvedValue(mockQuestion)

      // Act
      const result = await assessmentService.updateQuestion(assessmentId, questionId, updateData)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockQuestion.update).toHaveBeenCalledWith(updateData)
      expect(mockOptionSave).toHaveBeenCalled()
      expect(result).toEqual(mockQuestion)
    }) */

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999
      const questionId = 2
      const updateData = { question_text: 'Updated text' }

      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(
        assessmentService.updateQuestion(assessmentId, questionId, updateData)
      ).rejects.toThrow('Assessment not found')
      expect(mockQuestionModel.findByPk).not.toHaveBeenCalled()
    })

    test('should throw error if question does not exist', async () => {
      // Arrange
      const assessmentId = 1
      const questionId = 999
      const updateData = { question_text: 'Updated text' }

      const mockAssessment = { id: assessmentId }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)
      mockQuestionModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(
        assessmentService.updateQuestion(assessmentId, questionId, updateData)
      ).rejects.toThrow('Question not found')
    })
  })

  describe('deleteQuestion', () => {
    test('should delete a question successfully', async () => {
      // Arrange
      const assessmentId = 1
      const questionId = 2

      const mockAssessment = { id: assessmentId }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockQuestion = {
        id: questionId,
        assessment_id: assessmentId,
        destroy: jest.fn().mockResolvedValue(true),
      }
      mockQuestionModel.findOne.mockResolvedValue(mockQuestion)

      // Act
      await assessmentService.deleteQuestion(assessmentId, questionId)

      // Assert
      expect(mockAssessmentModel.findByPk).toHaveBeenCalledWith(assessmentId)
      expect(mockQuestionModel.findOne).toHaveBeenCalledWith({
        where: {
          id: questionId,
          assessment_id: assessmentId,
        },
      })
      expect(mockQuestion.destroy).toHaveBeenCalled()
    })

    test('should throw error if assessment does not exist', async () => {
      // Arrange
      const assessmentId = 999
      const questionId = 2

      mockAssessmentModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.deleteQuestion(assessmentId, questionId)).rejects.toThrow(
        'Assessment not found'
      )
      expect(mockQuestionModel.findByPk).not.toHaveBeenCalled()
    })

    test('should throw error if question does not exist', async () => {
      // Arrange
      const assessmentId = 1
      const questionId = 999

      const mockAssessment = { id: assessmentId }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)
      mockQuestionModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.deleteQuestion(assessmentId, questionId)).rejects.toThrow(
        'Question not found'
      )
    })

    test('should throw error if question belongs to different assessment', async () => {
      // Arrange
      const assessmentId = 1
      const questionId = 2

      const mockAssessment = { id: assessmentId }
      mockAssessmentModel.findByPk.mockResolvedValue(mockAssessment)

      const mockQuestion = {
        id: questionId,
        assessment_id: 999, // Different assessment ID
        destroy: jest.fn(),
      }
      mockQuestionModel.findByPk.mockResolvedValue(mockQuestion)

      // Act & Assert
      await expect(assessmentService.deleteQuestion(assessmentId, questionId)).rejects.toThrow(
        'Question not found in this assessment'
      )
      expect(mockQuestion.destroy).not.toHaveBeenCalled()
    })
  })

  describe('getSubmissionById', () => {
    test('should get submission by ID successfully', async () => {
      // Arrange
      const submissionId = 1

      const mockSubmission = {
        id: submissionId,
        assessment_id: 5,
        user_id: 10,
        status: 'submitted',
      }
      mockSubmissionModel.findByPk.mockResolvedValue(mockSubmission)

      // Act
      const result = await assessmentService.getSubmissionById(submissionId)

      // Assert
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId, {
        include: [
          expect.objectContaining({
            model: mockUserModel,
            as: 'user',
          }),
          expect.objectContaining({
            model: mockAnswerResponseModel,
            as: 'answers',
          }),
          expect.objectContaining({
            model: mockAssessmentModel,
            as: 'assessment',
          }),
        ],
      })
      expect(result).toEqual(mockSubmission)
    })

    test('should throw error if submission does not exist', async () => {
      // Arrange
      const submissionId = 999

      mockSubmissionModel.findByPk.mockResolvedValue(null)

      // Act & Assert
      await expect(assessmentService.getSubmissionById(submissionId)).rejects.toThrow(
        'Submission not found'
      )
      expect(mockSubmissionModel.findByPk).toHaveBeenCalledWith(submissionId, expect.anything())
    })
  })
})

import { assessmentSchemas } from '../../../src/schemas/assessmentSchemas' // Adjust path if needed

describe('Assessment Schemas', () => {
  describe('createAssessment Schema', () => {
    const schema = assessmentSchemas.createAssessment.body

    let validAssessmentData

    beforeEach(() => {
      // Reset valid data before each test
      validAssessmentData = {
        title: 'Introduction Quiz',
        module_id: 1,
        type: 'quiz',
        max_score: 100,
        passing_score: 70,
        allowed_attempts: 1,
        // Optional fields can be added or tested separately
        description: 'A short quiz about the intro module.',
        duration_minutes: 30,
        due_date: new Date().toISOString(),
        is_published: false,
        instructions: 'Read carefully.',
      }
    })

    it('should validate correct assessment data', () => {
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeUndefined()
    })

    it('should invalidate missing required title', () => {
      delete validAssessmentData.title
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"title" is required')
    })

    it('should invalidate invalid type', () => {
      validAssessmentData.type = 'invalid_type'
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"type" must be one of [quiz, assignment, exam]')
    })

    it('should invalidate if passing_score > max_score', () => {
      validAssessmentData.passing_score = 110
      validAssessmentData.max_score = 100
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Passing score cannot exceed maximum score')
    })

    it('should validate if passing_score is null', () => {
      validAssessmentData.passing_score = null
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeUndefined()
    })

    it('should apply default for max_score if not provided', () => {
      delete validAssessmentData.max_score
      const { value, error } = schema.validate(validAssessmentData)
      expect(error).toBeUndefined()
      expect(value.max_score).toBe(100)
    })

    it('should apply default for is_published if not provided', () => {
      delete validAssessmentData.is_published
      const { value, error } = schema.validate(validAssessmentData)
      expect(error).toBeUndefined()
      expect(value.is_published).toBe(false)
    })

    it('should invalidate missing required allowed_attempts', () => {
      delete validAssessmentData.allowed_attempts
      const { error } = schema.validate(validAssessmentData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"allowed_attempts" is required')
    })
  })

  describe('addQuestion Schema', () => {
    const schema = assessmentSchemas.addQuestion.body

    let validMultipleChoiceData
    let validTrueFalseData
    let validShortAnswerData
    let validEssayData

    beforeEach(() => {
      validMultipleChoiceData = {
        question_text: 'What is 2+2?',
        question_type: 'multiple_choice',
        points: 5,
        options: [
          { text: '3', is_correct: false },
          { text: '4', is_correct: true },
          { text: '5', is_correct: false },
        ],
      }
      validTrueFalseData = {
        question_text: 'Is the sky blue?',
        question_type: 'true_false',
        options: [
          { text: 'True', is_correct: true },
          { text: 'False', is_correct: false },
        ],
      }
      validShortAnswerData = {
        question_text: 'What is the capital of France?',
        question_type: 'short_answer',
        answer_key: 'Paris',
      }
      validEssayData = {
        question_text: 'Explain photosynthesis.',
        question_type: 'essay',
        word_limit: 500,
        answer_key: 'Plants use sunlight...', // Optional guide for grader
      }
    })

    it('should validate correct multiple choice question data', () => {
      const { error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeUndefined()
    })

    it('should validate correct true/false question data', () => {
      const { error } = schema.validate(validTrueFalseData)
      expect(error).toBeUndefined()
    })

    it('should validate correct short answer question data', () => {
      const { error } = schema.validate(validShortAnswerData)
      expect(error).toBeUndefined()
    })

    it('should validate correct essay question data', () => {
      const { error } = schema.validate(validEssayData)
      expect(error).toBeUndefined()
    })

    it('should invalidate multiple choice with less than 2 options', () => {
      validMultipleChoiceData.options = [{ text: '4', is_correct: true }]
      const { error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"options" must contain at least 2 items')
    })

    it('should invalidate multiple choice with no correct option', () => {
      validMultipleChoiceData.options = [
        { text: '3', is_correct: false },
        { text: '4', is_correct: false },
        { text: '5', is_correct: false },
      ]
      const { error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one option must be marked as correct')
    })

    it('should invalidate if options provided for short_answer', () => {
      validShortAnswerData.options = [{ text: 'Paris', is_correct: true }]
      const { error } = schema.validate(validShortAnswerData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"options" is not allowed')
    })

    it('should invalidate if answer_key provided for multiple_choice', () => {
      validMultipleChoiceData.answer_key = '4'
      const { error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"answer_key" is not allowed')
    })

    it('should invalidate if word_limit provided for non-essay', () => {
      validMultipleChoiceData.word_limit = 100
      const { error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"word_limit" is not allowed')
    })

    it('should apply default for points if not provided', () => {
      delete validMultipleChoiceData.points
      const { value, error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeUndefined()
      expect(value.points).toBe(1)
    })

    it('should apply default for order_index if not provided', () => {
      const { value, error } = schema.validate(validMultipleChoiceData)
      expect(error).toBeUndefined()
      expect(value.order_index).toBe(0)
    })
  })

  describe('updateAssessment Schema', () => {
    const schema = assessmentSchemas.updateAssessment.body
    const paramsSchema = assessmentSchemas.updateAssessment.params

    it('should validate correct partial update data', () => {
      const { error } = schema.validate({ title: 'Updated Title' })
      expect(error).toBeUndefined()
    })

    it('should validate correct full update data', () => {
      const fullUpdate = {
        title: 'Fully Updated Quiz',
        description: 'Updated description.',
        type: 'assignment',
        max_score: 50,
        passing_score: 40,
        duration_minutes: 60,
        due_date: new Date().toISOString(),
        is_published: true,
        instructions: 'Follow instructions.',
        allowed_attempts: 2,
      }
      const { error } = schema.validate(fullUpdate)
      expect(error).toBeUndefined()
    })

    it('should invalidate if passing_score > max_score', () => {
      const { error } = schema.validate({ passing_score: 110, max_score: 100 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Passing score cannot exceed maximum score')
    })

    it('should validate if only passing_score is provided (max_score undefined)', () => {
      const { error } = schema.validate({ passing_score: 50 })
      // Validation passes because the custom rule only triggers if BOTH are defined
      expect(error).toBeUndefined()
    })

    it('should validate if only max_score is provided (passing_score undefined)', () => {
      const { error } = schema.validate({ max_score: 100 })
      // Validation passes because the custom rule only triggers if BOTH are defined
      expect(error).toBeUndefined()
    })

    it('should invalidate if empty object is provided (min(1))', () => {
      const { error } = schema.validate({})
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"value" must have at least 1 key')
    })

    it('should validate correct params', () => {
      const { error } = paramsSchema.validate({ assessmentId: 1 })
      expect(error).toBeUndefined()
    })

    it('should invalidate incorrect params type', () => {
      const { error } = paramsSchema.validate({ assessmentId: 'abc' })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"assessmentId" must be a number')
    })
  })

  describe('updateQuestion Schema', () => {
    const schema = assessmentSchemas.updateQuestion.body
    const paramsSchema = assessmentSchemas.updateQuestion.params

    it('should validate partial update (text)', () => {
      const { error } = schema.validate({ question_text: 'New text?' })
      expect(error).toBeUndefined()
    })

    it('should validate partial update (options for existing MC question)', () => {
      // Note: The custom validation relies on context (question_type) which isn't
      // directly available in unit tests like this. We assume the context is set correctly
      // for the custom rule to pass or fail appropriately in integration tests.
      // Here, we just test the structure.
      const updateData = {
        options: [
          { id: 1, text: 'A', is_correct: false },
          { id: 2, text: 'B', is_correct: true },
        ],
      }
      // We can't easily simulate the context `helpers.state.ancestors[0]` here.
      // A simple validation without context check:
      const { error } = schema.validate(updateData)
      expect(error).toBeUndefined() // Basic structure is valid
    })

    // New tests for custom validation logic in options
    it('should invalidate multiple choice question with less than 2 options', () => {
      const updateData = {
        question_type: 'multiple_choice',
        options: [
          { id: 1, text: 'Only option', is_correct: true }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Multiple choice questions must have at least 2 options')
    })

    it('should invalidate true/false question with less than 2 options', () => {
      const updateData = {
        question_type: 'true_false',
        options: [
          { id: 1, text: 'True', is_correct: true }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('Multiple choice questions must have at least 2 options')
    })

    it('should invalidate multiple choice question with no correct options', () => {
      const updateData = {
        question_type: 'multiple_choice',
        options: [
          { id: 1, text: 'Option A', is_correct: false },
          { id: 2, text: 'Option B', is_correct: false }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one option must be marked as correct')
    })

    it('should invalidate true/false question with no correct options', () => {
      const updateData = {
        question_type: 'true_false',
        options: [
          { id: 1, text: 'True', is_correct: false },
          { id: 2, text: 'False', is_correct: false }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('At least one option must be marked as correct')
    })

    it('should validate multiple choice question with valid options', () => {
      const updateData = {
        question_type: 'multiple_choice',
        options: [
          { id: 1, text: 'Option A', is_correct: false },
          { id: 2, text: 'Option B', is_correct: true },
          { id: 3, text: 'Option C', is_correct: false }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeUndefined()
    })

    it('should validate true/false question with valid options', () => {
      const updateData = {
        question_type: 'true_false',
        options: [
          { id: 1, text: 'True', is_correct: true },
          { id: 2, text: 'False', is_correct: false }
        ]
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeUndefined()
    })

    it('should not apply options validation for short_answer question type', () => {
      const updateData = {
        question_type: 'short_answer',
        options: [] // Empty options shouldn't trigger validation for non-MC/TF types
      }
      const { error } = schema.validate(updateData)
      expect(error).toBeUndefined()
    })

    it('should invalidate if empty object is provided (min(1))', () => {
      const { error } = schema.validate({})
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"value" must have at least 1 key')
    })

    // Add more tests for specific fields like points, order_index, etc.

    it('should validate correct params', () => {
      const { error } = paramsSchema.validate({ assessmentId: 1, questionId: 10 })
      expect(error).toBeUndefined()
    })

    it('should invalidate missing questionId param', () => {
      const { error } = paramsSchema.validate({ assessmentId: 1 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"questionId" is required')
    })
  })

  describe('saveAnswer Schema', () => {
    const schema = assessmentSchemas.saveAnswer.body
    const paramsSchema = assessmentSchemas.saveAnswer.params

    it('should validate with optionId only', () => {
      const { error } = schema.validate({ optionId: 5 })
      expect(error).toBeUndefined()
    })

    it('should validate with textResponse only', () => {
      const { error } = schema.validate({ textResponse: 'Student answer' })
      expect(error).toBeUndefined()
    })

    it('should invalidate if both optionId and textResponse are provided (xor)', () => {
      const { error } = schema.validate({ optionId: 5, textResponse: 'Student answer' })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"value" contains a conflict between exclusive peers [optionId, textResponse]'
      )
    })

    it('should invalidate if neither optionId nor textResponse are provided (xor)', () => {
      const { error } = schema.validate({})
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain(
        '"value" must contain at least one of [optionId, textResponse]'
      )
    })

    it('should validate correct params', () => {
      const { error } = paramsSchema.validate({ submissionId: 1, questionId: 10 })
      expect(error).toBeUndefined()
    })
  })

  describe('gradeSubmission Schema', () => {
    const schema = assessmentSchemas.gradeSubmission.body
    const paramsSchema = assessmentSchemas.gradeSubmission.params

    let validGradeData

    beforeEach(() => {
      validGradeData = {
        grade: {
          questionId: 1,
          points: 8,
          feedback: 'Good job!',
        },
        feedback: 'Overall good submission.',
      }
    })

    it('should validate correct grade data', () => {
      const { error } = schema.validate(validGradeData)
      expect(error).toBeUndefined()
    })

    it('should invalidate missing grade object', () => {
      delete validGradeData.grade
      const { error } = schema.validate(validGradeData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"grade" is required')
    })

    it('should invalidate missing grade.questionId', () => {
      delete validGradeData.grade.questionId
      const { error } = schema.validate(validGradeData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"grade.questionId" is required')
    })

    it('should invalidate missing grade.points', () => {
      delete validGradeData.grade.points
      const { error } = schema.validate(validGradeData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"grade.points" is required')
    })

    it('should validate with null feedback', () => {
      validGradeData.grade.feedback = null
      validGradeData.feedback = null
      const { error } = schema.validate(validGradeData)
      expect(error).toBeUndefined()
    })

    it('should validate correct params', () => {
      const { error } = paramsSchema.validate({ submissionId: 1 })
      expect(error).toBeUndefined()
    })
  })

  // --- Tests for Schemas with only Params ---

  describe('Parameter-only Schemas', () => {
    const testParam = (schemaName, paramName, validValue, invalidValue) => {
      describe(`${schemaName} Schema`, () => {
        const schema = assessmentSchemas[schemaName].params
        it(`should validate correct ${paramName}`, () => {
          // Special case for deleteQuestion which requires both assessmentId and questionId
          if (schemaName === 'deleteQuestion') {
            const { error } = schema.validate({ assessmentId: 1, [paramName]: validValue })
            expect(error).toBeUndefined()
          } else {
            const { error } = schema.validate({ [paramName]: validValue })
            expect(error).toBeUndefined()
          }
        })
        it(`should invalidate incorrect ${paramName} type`, () => {
          // Special case for deleteQuestion which requires both assessmentId and questionId
          if (schemaName === 'deleteQuestion') {
            const { error } = schema.validate({ assessmentId: 1, [paramName]: invalidValue })
            expect(error).toBeDefined()
            expect(error.details[0].message).toContain(`"${paramName}" must be a number`)
          } else {
            const { error } = schema.validate({ [paramName]: invalidValue })
            expect(error).toBeDefined()
            expect(error.details[0].message).toContain(`"${paramName}" must be a number`)
          }
        })
        it(`should invalidate missing ${paramName}`, () => {
          // Special case for deleteQuestion which requires assessmentId
          if (schemaName === 'deleteQuestion') {
            const { error } = schema.validate({ assessmentId: 1 })
            expect(error).toBeDefined()
            expect(error.details[0].message).toContain(`"${paramName}" is required`)
          } else {
            const { error } = schema.validate({})
            expect(error).toBeDefined()
            expect(error.details[0].message).toContain(`"${paramName}" is required`)
          }
        })
      })
    }

    testParam('deleteAssessment', 'assessmentId', 1, 'abc')
    testParam('deleteQuestion', 'questionId', 10, 'def') 
    testParam('startSubmission', 'assessmentId', 1, 'ghi')
    testParam('submitAssessment', 'submissionId', 1, 'jkl')
    testParam('publishAssessment', 'assessmentId', 1, 'mno')
    testParam('unpublishAssessment', 'assessmentId', 1, 'pqr')
    testParam('getSubmissionsForAssessment', 'assessmentId', 1, 'stu')
    testParam('getAssessmentsForModule', 'moduleId', 1, 'vwx')
    testParam('getStudentSubmissions', 'assessmentId', 1, 'yz')
    testParam('getStudentSubmission', 'assessmentId', 1, 'a1')
    testParam('getSubmissionById', 'submissionId', 1, 'b2')
  })

  // --- Tests for Schemas with Query Params ---

  describe('getAssessmentById Schema', () => {
    const schema = assessmentSchemas.getAssessmentById.query
    const paramsSchema = assessmentSchemas.getAssessmentById.params

    it('should validate with default query params', () => {
      const { value, error } = schema.validate({})
      expect(error).toBeUndefined()
      expect(value.includeQuestions).toBe(false)
      expect(value.teacherView).toBe(false)
      expect(value.page).toBe(1)
      expect(value.limit).toBe(20)
    })

    it('should validate with specific query params', () => {
      const query = { includeQuestions: true, teacherView: true, page: 2, limit: 50 }
      const { value, error } = schema.validate(query)
      expect(error).toBeUndefined()
      expect(value.includeQuestions).toBe(true)
      expect(value.teacherView).toBe(true)
      expect(value.page).toBe(2)
      expect(value.limit).toBe(50)
    })

    it('should invalidate invalid page number', () => {
      const { error } = schema.validate({ page: 0 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"page" must be greater than or equal to 1')
    })

    it('should invalidate invalid limit', () => {
      const { error } = schema.validate({ limit: 200 })
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('"limit" must be less than or equal to 100')
    })

    it('should validate correct params', () => {
      const { error } = paramsSchema.validate({ assessmentId: 1 })
      expect(error).toBeUndefined()
    })
  })

  // Add similar describe blocks for other schemas with query parameters:
  // getAssessmentsForModule, getStudentSubmissions, getStudentSubmission, getSubmissionById
  // focusing on their specific query params and defaults.
})

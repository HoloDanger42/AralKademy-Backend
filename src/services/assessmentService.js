import { log } from '../utils/logger.js'

class AssessmentService {
  /**
   * @class AssessmentService
   * @description Service class for handling assessment-related operations
   * @param {Object} AssessmentModel - The model for assessments
   * @param {Object} QuestionModel - The model for questions
   * @param {Object} QuestionOptionModel - The model for question options
   * @param {Object} SubmissionModel - The model for submissions
   * @param {Object} AnswerResponseModel - The model for answer responses
   * @param {Object} CourseModel - The model for courses
   * @param {Object} UserModel - The model for users
   */
  constructor(
    AssessmentModel,
    QuestionModel,
    QuestionOptionModel,
    SubmissionModel,
    AnswerResponseModel,
    CourseModel,
    UserModel
  ) {
    this.AssessmentModel = AssessmentModel
    this.QuestionModel = QuestionModel
    this.QuestionOptionModel = QuestionOptionModel
    this.SubmissionModel = SubmissionModel
    this.AnswerResponseModel = AnswerResponseModel
    this.CourseModel = CourseModel
    this.UserModel = UserModel
  }

  /**
   * Creates a new assessment
   * @param {Object} assessmentData - Data for the assessment
   * @returns {Promise<Object>} The created assessment
   */
  async createAssessment(assessmentData) {
    try {
      // Verify that the course exists
      const course = await this.CourseModel.findByPk(assessmentData.course_id)
      if (!course) {
        throw new Error('Course not found')
      }

      return await this.AssessmentModel.create(assessmentData)
    } catch (error) {
      log.error('Create assessment error:', error)
      throw error
    }
  }

  /**
   * Adds a question to an assessment
   * @param {number} assessmentId - ID of the assessment
   * @param {Object} questionData - Data for the question
   * @returns {Promise<Object>} The created question
   */
  async addQuestion(assessmentId, questionData) {
    try {
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      const question = await this.QuestionModel.create({
        ...questionData,
        assessment_id: assessmentId,
      })

      // If options are provided for multiple choice questions
      if (
        questionData.options &&
        (questionData.question_type === 'multiple_choice' ||
          questionData.question_type === 'true_false')
      ) {
        for (let i = 0; i < questionData.options.length; i++) {
          const option = questionData.options[i]
          await this.QuestionOptionModel.create({
            question_id: question.id,
            option_text: option.text,
            is_correct: option.is_correct || false,
            order_index: i,
          })
        }
      }

      return question
    } catch (error) {
      log.error('Add question error:', error)
      throw error
    }
  }

  /**
   * Gets assessments for a course
   * @param {number} courseId - ID of the course
   * @param {boolean} includeQuestions - Whether to include questions
   * @returns {Promise<Array>} The assessments for the course
   */
  async getAssessmentsForCourse(courseId, includeQuestions = false) {
    try {
      const course = await this.CourseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      const include = []

      if (includeQuestions) {
        include.push({
          model: this.QuestionModel,
          as: 'questions',
          include: [
            {
              model: this.QuestionOptionModel,
              as: 'options',
              // Don't return is_correct for student_view
              attributes: ['id', 'option_text', 'order_index'],
            },
          ],
        })
      }

      return await this.AssessmentModel.findAll({
        where: { course_id: courseId },
        include,
      })
    } catch (error) {
      log.error('Get assessments error:', error)
      throw error
    }
  }

  /**
   * Gets an assessment by ID
   * @param {number} assessmentId - ID of the assessment
   * @param {boolean} includeQuestions - Whether to include questions
   * @param {boolean} teacherView - Whether this is for a teacher (includes correct answers)
   * @returns {Promise<Object>} The assessment
   */
  async getAssessmentById(assessmentId, includeQuestions = false, teacherView = false) {
    try {
      const include = []

      if (includeQuestions) {
        const questionInclude = {
          model: this.QuestionModel,
          as: 'questions',
          include: [],
        }

        const optionAttributes = teacherView
          ? ['id', 'option_text', 'is_correct', 'order_index']
          : ['id', 'option_text', 'order_index']

        questionInclude.include.push({
          model: this.QuestionOptionModel,
          as: 'options',
          attributes: optionAttributes,
        })

        include.push(questionInclude)
      }

      const assessment = await this.AssessmentModel.findByPk(assessmentId, { include })

      if (!assessment) {
        throw new Error('Assessment not found')
      }

      return assessment
    } catch (error) {
      log.error('Get assessment error:', error)
      throw error
    }
  }

  /**
   * Creates a submission for an assessment
   * @param {number} assessmentId - ID of the assessment
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>} The created submission
   */
  async startSubmission(assessmentId, userId) {
    try {
      // Check if user already has an in-progress submission
      const existingSubmission = await this.SubmissionModel.findOne({
        where: {
          assessment_id: assessmentId,
          user_id: userId,
          status: 'in_progress',
        },
      })

      if (existingSubmission) {
        return existingSubmission
      }

      // Get the assessment to check if it exists and get max score
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      // Create new submission
      return await this.SubmissionModel.create({
        assessment_id: assessmentId,
        user_id: userId,
        max_score: assessment.max_score,
        status: 'in_progress',
      })
    } catch (error) {
      log.error('Start submission error:', error)
      throw error
    }
  }

  /**
   * Saves an answer response
   * @param {number} submissionId - ID of the submission
   * @param {number} questionId - ID of the question
   * @param {Object} answerData - The answer data (option ID or text)
   * @returns {Promise<Object>} The saved answer
   */
  async saveAnswer(submissionId, questionId, answerData) {
    try {
      const submission = await this.SubmissionModel.findByPk(submissionId)
      if (!submission) {
        throw new Error('Submission not found')
      }

      if (submission.status !== 'in_progress') {
        throw new Error('Cannot modify a submitted assessment')
      }

      const question = await this.QuestionModel.findByPk(questionId)
      if (!question) {
        throw new Error('Question not found')
      }

      if (
        (question.question_type === 'multiple_choice' || question.question_type === 'true_false') &&
        !answerData.optionId
      ) {
        throw new Error(`Invalid answer format for question type ${question.question_type}`)
      } else if (
        question.question_type !== 'multiple_choice' &&
        question.question_type !== 'true_false' &&
        !answerData.textResponse
      ) {
        throw new Error(`Invalid answer format for question type ${question.question_type}`)
      }

      // Check if answer already exists
      let answer = await this.AnswerResponseModel.findOne({
        where: {
          submission_id: submissionId,
          question_id: questionId,
        },
      })

      if (answer) {
        // Update existing answer
        if (
          question.question_type === 'multiple_choice' ||
          question.question_type === 'true_false'
        ) {
          answer.selected_option_id = answerData.optionId
          answer.text_response = null
        } else {
          answer.selected_option_id = null
          answer.text_response = answerData.textResponse
        }
        await answer.save()
      } else {
        // Create new answer
        answer = await this.AnswerResponseModel.create({
          submission_id: submissionId,
          question_id: questionId,
          selected_option_id:
            question.question_type === 'multiple_choice' || question.question_type === 'true_false'
              ? answerData.optionId
              : null,
          text_response:
            question.question_type === 'multiple_choice' || question.question_type === 'true_false'
              ? null
              : answerData.textResponse,
        })
      }

      return answer
    } catch (error) {
      log.error('Save answer error:', error)
      throw error
    }
  }

  /**
   * Submits an assessment
   * @param {number} submissionId - ID of the submission
   * @param {number} userId - ID of the user
   * @returns {Promise<Object>} The updated submission
   */
  async submitAssessment(submissionId, userId) {
    try {
      const submission = await this.SubmissionModel.findByPk(submissionId)
      if (!submission) {
        throw new Error('Submission not found')
      }

      if (submission.user_id !== userId) {
        throw new Error('Unauthorized submission')
      }

      if (submission.status !== 'in_progress') {
        throw new Error('Assessment already submitted')
      }

      // Check if submission is late
      const assessment = await this.AssessmentModel.findByPk(submission.assessment_id)
      const now = new Date()
      let isLate = false

      if (assessment.due_date && now > new Date(assessment.due_date)) {
        isLate = true
      }

      // Auto-grade multiple choice questions
      if (assessment.type === 'quiz') {
        // Get all answers for this submission
        const answers = await this.AnswerResponseModel.findAll({
          where: { submission_id: submissionId },
          include: [
            {
              model: this.QuestionModel,
              as: 'question',
              include: [
                {
                  model: this.QuestionOptionModel,
                  as: 'options',
                  where: { is_correct: true },
                  required: false,
                },
              ],
            },
          ],
        })

        let totalScore = 0

        // Grade each multiple choice/true-false answer
        for (const answer of answers) {
          if (
            answer.question.question_type === 'multiple_choice' ||
            answer.question.question_type === 'true_false'
          ) {
            // Find if selected option is correct
            const correctOption = answer.question.options.find(
              (option) => option.id === answer.selected_option_id
            )

            if (correctOption) {
              // Award full points for correct answer
              answer.points_awarded = answer.question.points
            } else {
              // Zero points for incorrect answer
              answer.points_awarded = 0
            }

            totalScore += answer.points_awarded
            await answer.save()
          }
          // For short answer and essay, leave points_awarded as null for manual grading
        }

        // Update submission with score
        submission.score = totalScore
        submission.status = 'graded'
      } else {
        // For assignments and exams, set status to submitted but not graded
        submission.status = 'submitted'
      }

      submission.submit_time = now
      submission.is_late = isLate

      await submission.save()
      return submission
    } catch (error) {
      log.error('Submit assessment error:', error)
      throw error
    }
  }

  /**
   * Gets submissions for an assessment
   * @param {number} assessmentId - ID of the assessment
   * @returns {Promise<Array>} The submissions
   */
  async getSubmissionsForAssessment(assessmentId) {
    try {
      return await this.SubmissionModel.findAll({
        where: { assessment_id: assessmentId },
        include: [
          {
            model: this.UserModel,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
        ],
      })
    } catch (error) {
      log.error('Get submissions error:', error)
      throw error
    }
  }

  /**
   * Gets a student's submission for an assessment
   * @param {number} assessmentId - ID of the assessment
   * @param {number} userId - ID of the user
   * @param {boolean} includeAnswers - Whether to include answers
   * @returns {Promise<Object>} The submission
   */
  async getStudentSubmission(assessmentId, userId, includeAnswers = false) {
    try {
      const where = {
        assessment_id: assessmentId,
        user_id: userId,
      }

      const include = []

      if (includeAnswers) {
        include.push({
          model: this.AnswerResponseModel,
          as: 'answers',
          include: [
            {
              model: this.QuestionModel,
              as: 'question',
            },
            {
              model: this.QuestionOptionModel,
              as: 'selected_option',
            },
          ],
        })
      }

      return await this.SubmissionModel.findOne({ where, include })
    } catch (error) {
      log.error('Get student submission error:', error)
      throw error
    }
  }

  /**
   * Grades a submission
   * @param {number} submissionId - ID of the submission
   * @param {Array} grades = Array of question grades
   * @param {string} feedback - Overall feedback
   * @return {Promise<Object>} The updated submission
   */
  async gradeSubmission(submissionId, grades, feedback) {
    try {
      const submission = await this.SubmissionModel.findByPk(submissionId)
      if (!submission) {
        throw new Error('Submission not found')
      }

      // Update each answer with its grade and feedback
      let totalScore = 0

      for (const grade of grades) {
        const answer = await this.AnswerResponseModel.findOne({
          where: {
            submission_id: submissionId,
            question_id: grade.questionId,
          },
        })

        if (!answer) {
          continue // Skip if answer doesn't exist
        }

        answer.points_awarded = grade.points
        answer.feedback = grade.feedback
        await answer.save()

        totalScore += grade.points
      }

      // Update the submission
      submission.score = totalScore
      submission.feedback = feedback
      submission.status = 'graded'
      await submission.save()

      return submission
    } catch (error) {
      log.error('Grade submission error:', error)
      throw error
    }
  }
}

export default AssessmentService

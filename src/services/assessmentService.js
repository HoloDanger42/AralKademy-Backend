import { log } from '../utils/logger.js'
import { Op } from 'sequelize'
import ModuleService from './moduleService.js';
import GroupService from './groupService.js';
import nodemailer from 'nodemailer'

// Configure nodemailer with proper error handling
const transporter = (() => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    log.warn('Email credentials not configured.')
    return null
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
})()

class AssessmentService {
  /**
   * @class AssessmentService
   * @description Service class for handling assessment-related operations
   * @param {Object} AssessmentModel - The model for assessments
   * @param {Object} QuestionModel - The model for questions
   * @param {Object} QuestionOptionModel - The model for question options
   * @param {Object} SubmissionModel - The model for submissions
   * @param {Object} AnswerResponseModel - The model for answer responses
   * @param {Object} ModuleModel - The model for modules
   * @param {Object} UserModel - The model for users
   */
  constructor(
    AssessmentModel,
    QuestionModel,
    QuestionOptionModel,
    SubmissionModel,
    AnswerResponseModel,
    ModuleModel,
    UserModel,
    CourseModel,
    ContentModel,
    ModuleGradeModel,
    GroupModel,
    StudentTeacherModel,
    LearnerModel
  ) {
    this.AssessmentModel = AssessmentModel
    this.QuestionModel = QuestionModel
    this.QuestionOptionModel = QuestionOptionModel
    this.SubmissionModel = SubmissionModel
    this.AnswerResponseModel = AnswerResponseModel
    this.ModuleModel = ModuleModel
    this.UserModel = UserModel
    this.CourseModel = CourseModel

    this.moduleService = new ModuleService(
      ModuleModel,
      CourseModel,
      ContentModel,
      AssessmentModel,
      SubmissionModel,
      ModuleGradeModel,
      UserModel
    );

    this.groupService = new GroupService(
      GroupModel,
      StudentTeacherModel,
      LearnerModel,
      UserModel
    );
  }

  /**
   * Creates a new assessment
   * @param {Object} assessmentData - Data for the assessment
   * @returns {Promise<Object>} The created assessment
   */
  async createAssessment(assessmentData) {
    try {
      // Verify that the module exists
      const module = await this.ModuleModel.findByPk(assessmentData.module_id)
      if (!module) {
        throw new Error('Module not found')
      }

      if (assessmentData.passing_score && assessmentData.passing_score > assessmentData.max_score) {
        throw new Error('Passing score cannot exceed maximum score')
      }

      if (assessmentData.allowed_attempts == null || assessmentData.allowed_attempts <= 0) {
        throw new Error('Invalid allowed attempts')
      }

      const assessment = await this.AssessmentModel.create(assessmentData)
      return { assessment, course_id: module.course_id }
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

      const totalPoints = (await this.QuestionModel.sum('points', {
        where: { assessment_id: assessmentId },
      })) || 0;

      if (totalPoints + questionData.points > assessment.max_score) {
        throw new Error('Invalid total points');
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
   * Gets assessments for a module
   * @param {number} moduleId - ID of the module
   * @param {boolean} includeQuestions - Whether to include questions
   * @returns {Promise<Array>} The assessments for the module
   */
  async getAssessmentsForModule(moduleId, includeQuestions = false) {
    try {
      const module = await this.ModuleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
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

      const assessments = await this.AssessmentModel.findAll({
        where: { module_id: moduleId },
        include,
      })

      return { assessments, course_id: module.course_id }
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

      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      const currentModule = await this.moduleService.getModuleById(assessment.module_id)

      const courseModules = await this.moduleService.getModulesByCourseId(currentModule.course_id)

      const currentModuleIndex = courseModules.findIndex(m => m.module_id === currentModule.module_id);

      if (currentModuleIndex > 0) {
        const prevModule = courseModules[currentModuleIndex - 1];
        const prevModuleGrade = await this.moduleService.getModuleGradeOfUser(userId, prevModule.module_id);

        if (prevModuleGrade?.allPassed !== true) {
          throw new Error(`Invalid attempt`);
        }
      }

      const submissionCount = await this.SubmissionModel.count({
        where: { assessment_id: assessmentId, user_id: userId }
      });

      if (submissionCount >= assessment.allowed_attempts) {
        throw new Error('Invalid attempt')
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
      let gradedCount = 0

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
          gradedCount++
        }
        // For short answer and essay, leave points_awarded as null for manual grading
      }

      // Update submission with score
      submission.score = totalScore

      if (gradedCount === answers.length) {
        submission.status = 'graded'
      } else {
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
 * Gets all of a student's submissions for an assessment
 * @param {number} assessmentId - ID of the assessment
 * @param {number} userId - ID of the user
 * @param {boolean} includeAnswers - Whether to include answers
 * @returns {Promise<Array>} The submissions
 */
  async getStudentSubmissions(assessmentId, userId, includeAnswers = false) {
    try {
      const where = {
        assessment_id: assessmentId,
        user_id: userId,
      };

      const include = [];

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
        });
      }

      return await this.SubmissionModel.findAll({
        where,
        include,
      });
    } catch (error) {
      log.error('Get student submissions error:', error);
      throw error;
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

      return await this.SubmissionModel.findOne({
        where,
        include,
        order: [
          ['status', 'DESC'], // Order by status first ('submitted'/'graded' before 'in_progress')
          ['submit_time', 'DESC'], // Then by submission time
          ['start_time', 'DESC'], // Finally by start time for submissions with same status
        ],
      })
    } catch (error) {
      log.error('Get student submission error:', error)
      throw error
    }
  }

  /**
   * Gets a specific submission with answers
   * @param {number} submissionId - ID of the submission
   * @returns {Promise<Object>} The submission with answers
   */
  async getSubmissionById(submissionId) {
    try {
      const submission = await this.SubmissionModel.findByPk(submissionId, {
        include: [
          {
            model: this.UserModel,
            as: 'user',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          {
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
          },
          {
            model: this.AssessmentModel,
            as: 'assessment',
            include: [
              {
                model: this.QuestionModel,
                as: 'questions',
                include: [
                  {
                    model: this.QuestionOptionModel,
                    as: 'options',
                  },
                ],
              },
            ],
          },
        ],
      })

      if (!submission) {
        throw new Error('Submission not found')
      }

      return submission
    } catch (error) {
      log.error('Get submission by ID error:', error)
      throw error
    }
  }

  /**
   * Grades a submission
   * @param {number} submissionId - ID of the submission
   * @param {Array} grade = Question grade
   * @param {string} feedback - Overall feedback
   * @return {Promise<Object>} The updated submission
   */
  async gradeSubmission(submissionId, grade, feedback) {
    try {
      const submission = await this.SubmissionModel.findByPk(submissionId)
      if (!submission) {
        throw new Error('Submission not found')
      }

      const answer = await this.AnswerResponseModel.findOne({
        where: {
          submission_id: submissionId,
          question_id: grade.questionId,
        },
        include: [
          {
            model: this.QuestionModel,
            as: 'question',
          },
        ],
      })

      if (answer) {
        if (grade.points > answer.question.points) {
          throw new Error('Invalid points')
        }
        answer.points_awarded = grade.points
        answer.feedback = grade.feedback
        await answer.save()
      }

      // Recalculate total score after grading
      const totalScore = await this.AnswerResponseModel.sum('points_awarded', {
        where: { submission_id: submissionId },
      }) || 0;

      // Count total answers and graded answers
      const totalAnswers = await this.AnswerResponseModel.count({
        where: { submission_id: submissionId },
      });

      const gradedAnswers = await this.AnswerResponseModel.count({
        where: {
          submission_id: submissionId,
          points_awarded: { [Op.not]: null },
        },
      });

      // Combine new feedback with existing feedback (if any)
      if (submission.feedback) {
        submission.feedback += `\n\n${feedback}`; // Append new feedback, separating with two line breaks for clarity
      } else {
        submission.feedback = feedback; // If no feedback, just set the new feedback
      }

      // Update the submission
      submission.score = totalScore
      submission.status = totalAnswers === gradedAnswers ? 'graded' : 'submitted'; // Check if all answers are graded
      await submission.save()

      return submission
    } catch (error) {
      log.error('Grade submission error:', error)
      throw error
    }
  }

  /**
   * Updates an assessment
   * @param {number} assessmentId - ID of the assessment to update
   * @param {Object} assessmentData - Updated assessment data
   * @returns {Promise<Object>} The updated assessment
   */
  async updateAssessment(assessmentId, assessmentData) {
    try {
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      if (assessment.is_published) {
        throw new Error('Assessment must be unpublished to update assessment')
      }

      // If module_id is being updated, verify the module exists
      if (assessmentData.module_id && assessmentData.module_id !== assessment.module_id) {
        const module = await this.ModuleModel.findByPk(assessmentData.module_id)
        if (!module) {
          throw new Error('Module not found')
        }
      }

      if (
        (assessmentData.passing_score &&
          assessmentData.max_score &&
          assessmentData.passing_score > assessmentData.max_score) ||
        (assessmentData.max_score && assessmentData.passing_score > assessmentData.max_score)
      ) {
        throw new Error('Passing score cannot exceed maximum score')
      }

      if (assessmentData.allowed_attempts == null || assessmentData.allowed_attempts <= 0) {
        throw new Error('Invalid allowed attempts')
      }

      // Update the assessment
      await assessment.update(assessmentData)
      return assessment
    } catch (error) {
      log.error('Update assessment error:', error)
      throw error
    }
  }

  /**
   * Deletes an assessment
   * @param {number} assessmentId - ID of the assessment to delete
   * @returns {Promise<boolean>} True if successful
   */
  async deleteAssessment(assessmentId) {
    try {
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      if (assessment.is_published) {
        throw new Error('Assessment must be unpublished to delete assessment')
      }

      // Check if there are any submissions for this assessment
      const submissionCount = await this.SubmissionModel.count({
        where: { assessment_id: assessmentId },
      })

      if (submissionCount > 0) {
        throw new Error('Cannot delete assessment with existing submissions')
      }

      // Delete associated questions first (which will cascade delete options)
      await this.QuestionModel.destroy({
        where: { assessment_id: assessmentId },
      })

      // Delete the assessment
      await assessment.destroy()
      return true
    } catch (error) {
      log.error('Delete assessment error:', error)
      throw error
    }
  }

  /**
   * Updates a question
   * @param {number} assessmentId - ID of the assessment
   * @param {number} questionId - ID of the question to update
   * @param {Object} questionData - Updated question data
   * @returns {Promise<Object>} The updated question
   */
  async updateQuestion(assessmentId, questionId, questionData) {
    try {
      // Verify the assessment exists
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      if (assessment.is_published) {
        throw new Error('Assessment must be unpublished to update questions')
      }

      // Find the question and verify it belongs to the assessment
      const question = await this.QuestionModel.findOne({
        where: {
          id: questionId,
          assessment_id: assessmentId,
        },
      })

      if (!question) {
        throw new Error('Question not found in this assessment')
      }

      // Handle question type change if necessary
      if (questionData.question_type && questionData.question_type !== question.question_type) {
        // If changing to/from multiple choice or true/false, handle options accordingly
        if (
          (question.question_type === 'multiple_choice' ||
            question.question_type === 'true_false') &&
          questionData.question_type !== 'multiple_choice' &&
          questionData.question_type !== 'true_false'
        ) {
          // Changing from MC/TF to short_answer/essay - remove options
          await this.QuestionOptionModel.destroy({
            where: { question_id: questionId },
          })
        }
      }

      // Should enforce options when changing to multiple_choice/true_false
      if (
        questionData.question_type &&
        (questionData.question_type === 'multiple_choice' ||
          questionData.question_type === 'true_false') &&
        question.question_type !== questionData.question_type &&
        (!questionData.options || questionData.options.length < 2)
      ) {
        throw new Error('Multiple choice questions require at least 2 options')
      }

      const totalPoints = (await this.QuestionModel.sum('points', {
        where: {
          assessment_id: assessmentId,
          id: {
            [this.QuestionModel.sequelize.Sequelize.Op.ne]: questionId,
          },
        },
      })) || 0;

      if (totalPoints + questionData.points > assessment.max_score) {
        throw new Error('Invalid total points');
      }

      // Update the question
      await question.update(questionData)

      // Handle options if provided and question is multiple choice or true/false
      if (
        questionData.options &&
        (question.question_type === 'multiple_choice' || question.question_type === 'true_false')
      ) {
        // Delete existing options not in the update
        const optionIds = questionData.options.filter((opt) => opt.id).map((opt) => opt.id)

        // Delete options not included in the update
        if (optionIds.length > 0) {
          await this.QuestionOptionModel.destroy({
            where: {
              question_id: questionId,
              id: { [Op.notIn]: optionIds },
            },
          })
        } else {
          // If no IDs provided, delete all existing options
          await this.QuestionOptionModel.destroy({
            where: { question_id: questionId },
          })
        }

        // Update or create options
        for (let i = 0; i < questionData.options.length; i++) {
          const optionData = questionData.options[i]

          if (optionData.id) {
            // Update existing option
            await this.QuestionOptionModel.update(
              {
                option_text: optionData.text,
                is_correct: optionData.is_correct || false,
                order_index: i,
              },
              {
                where: {
                  id: optionData.id,
                  question_id: questionId,
                },
              }
            )
          } else {
            // Create new option
            await this.QuestionOptionModel.create({
              question_id: questionId,
              option_text: optionData.text,
              is_correct: optionData.is_correct || false,
              order_index: i,
            })
          }
        }
      }

      // Reload the question with its options
      return await this.QuestionModel.findByPk(questionId, {
        include: [
          {
            model: this.QuestionOptionModel,
            as: 'options',
          },
        ],
      })
    } catch (error) {
      log.error('Update question error:', error)
      throw error
    }
  }

  /**
   * Deletes a question
   * @param {number} assessmentId - ID of the assessment
   * @param {number} questionId - ID of the question to delete
   * @returns {Promise<boolean>} True if successful
   */
  async deleteQuestion(assessmentId, questionId) {
    try {
      // Verify the assessment exists
      const assessment = await this.AssessmentModel.findByPk(assessmentId)
      if (!assessment) {
        throw new Error('Assessment not found')
      }

      if (assessment.is_published) {
        throw new Error('Assessment must be unpublished to delete questions')
      }

      // Find the question and verify it belongs to the assessment
      const question = await this.QuestionModel.findOne({
        where: {
          id: questionId,
          assessment_id: assessmentId,
        },
      })

      if (!question) {
        throw new Error('Question not found in this assessment')
      }

      // Check if there are any answers for this question
      const answerCount = await this.AnswerResponseModel.count({
        where: { question_id: questionId },
      })

      if (answerCount > 0) {
        throw new Error('Cannot delete question with existing answers')
      }

      // Delete options first
      await this.QuestionOptionModel.destroy({
        where: { question_id: questionId },
      })

      // Delete the question
      await question.destroy()
      return true
    } catch (error) {
      log.error('Delete question error:', error)
      throw error
    }
  }

  /**
   * Publishes an assessment
   * @param {number} assessmentId - ID of the assessment to publish
   * @returns {Promise<Object>} The published assessment
   */
  async publishAssessment(assessmentId, skipEmail = false) {
    try {
      const assessment = await this.AssessmentModel.findByPk(assessmentId, {
        include: [
          {
            model: this.QuestionModel,
            as: 'questions',
            attributes: ['points'],
          },
          {
            model: this.ModuleModel, 
            as: 'module',  
            include: [
              {
                model: this.CourseModel,  
                as: 'course',  
                attributes: ['name', 'learner_group_id'], 
              }
            ]
          }
        ],
      });

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      const totalPoints = assessment.questions.reduce(
        (sum, question) => sum + question.points,
        0
      );

      if (totalPoints < assessment.max_score || totalPoints > assessment.max_score) {
        throw new Error('Total points of questions must be equal to max score');
      }

      // Update the assessment to be published
      assessment.is_published = true;
      await assessment.save();

      const learners = await this.groupService.getGroupMembers(assessment.module.course.learner_group_id)
      const emails = learners.map((learner) => learner.user.email)

      if (!skipEmail) {
        try {
          if (!transporter) {
            log.error('Email service not configured.')
            throw new Error('Email service unavailable')
          }

          const emailPromises = emails.map((email) => {
            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: email,
              subject: `${assessment.module.course.name} Assessment Published`,
              text: `New assessment in ${assessment.module.course.name} (${assessment.module.name}): ${assessment.title}\n\nType: ${assessment.type}\n\n${assessment.description ? assessment.description : 'The assessment has been published and is now available for you to complete.'}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="color: #4a4a4a;">New Assessment in ${assessment.module.course.name}</h2>
                    <p><strong>Title:</strong> ${assessment.title}</p>
                    <p><strong>Assessment Type:</strong> ${assessment.type}</p>
                    <p><strong>Description:</strong></p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                        <p>${assessment.description ? assessment.description : 'The assessment has been published and is now available for you to complete.'}</p>
                    </div>
                    <p>For more information, please log in to your account on the platform.</p>
                    <p>If you have any questions, feel free to contact us at aralkademy.techsupp@gmail.com.</p>
                    <p>Best regards,</p>
                    <p><strong>AralKademy Team</strong></p>
                </div>
              `          
            }
            return transporter.sendMail(mailOptions)
          })
          await Promise.all(emailPromises)
        } catch (emailError) {
          log.error('Failed to send email:', emailError)
        }
      }

      return assessment;
    } catch (error) {
      log.error('Publish assessment error:', error);
      throw error;
    }
  }

  /**
   * Unpublishes an assessment
   * @param {number} assessmentId - ID of the assessment to unpublish
   * @returns {Promise<Object>} The unpublished assessment
   */
  async unpublishAssessment(assessmentId) {
    try {
      const assessment = await this.AssessmentModel.findByPk(assessmentId)

      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Update the assessment to be unpublished
      assessment.is_published = false;
      await assessment.save();
      return assessment;
    } catch (error) {
      log.error('Unpublish assessment error:', error);
      throw error;
    }
  }
}

export default AssessmentService

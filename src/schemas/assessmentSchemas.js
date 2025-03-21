import Joi from 'joi'

export const assessmentSchemas = {
  createAssessment: {
    body: Joi.object({
      title: Joi.string().required(),
      description: Joi.string().allow('', null),
      course_id: Joi.number().integer().required(),
      type: Joi.string().valid('quiz', 'assignment', 'exam').required(),
      max_score: Joi.number().integer().min(0).default(100),
      passing_score: Joi.number().integer().min(0).allow(null),
      duration_minutes: Joi.number().integer().min(1).allow(null),
      due_date: Joi.date().iso().allow(null),
      is_published: Joi.boolean().default(false),
      instructions: Joi.string().allow('', null),
    }),
  },

  updateAssessment: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
    body: Joi.object({
      title: Joi.string(),
      description: Joi.string().allow('', null),
      type: Joi.string().valid('quiz', 'assignment', 'exam'),
      max_score: Joi.number().integer().min(0),
      passing_score: Joi.number().integer().min(0).allow(null),
      duration_minutes: Joi.number().integer().min(1).allow(null),
      due_date: Joi.date().iso().allow(null),
      is_published: Joi.boolean(),
      instructions: Joi.string().allow('', null),
    }).min(1), // At least one field must be provided
  },

  deleteAssessment: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
  },

  addQuestion: {
    body: Joi.object({
      question_text: Joi.string().required(),
      question_type: Joi.string()
        .valid('multiple_choice', 'true_false', 'short_answer', 'essay')
        .required(),
      points: Joi.number().integer().min(1).default(1),
      order_index: Joi.number().integer().min(0).default(0),
      media_url: Joi.string().uri().allow('', null),
      options: Joi.when('question_type', {
        is: Joi.string().valid('multiple_choice', 'true_false'),
        then: Joi.array()
          .items(
            Joi.object({
              text: Joi.string().required(),
              is_correct: Joi.boolean().required(),
            })
          )
          .min(2)
          .required(),
        otherwise: Joi.forbidden(),
      }),
      answer_key: Joi.when('question_type', {
        is: Joi.string().valid('short_answer', 'essay'),
        then: Joi.string().allow('', null),
        otherwise: Joi.forbidden(),
      }),
      word_limit: Joi.when('question_type', {
        is: 'essay',
        then: Joi.number().integer().min(0).allow(null),
        otherwise: Joi.forbidden(),
      }),
    }),
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
  },

  updateQuestion: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
      questionId: Joi.number().integer().required(),
    }),
    body: Joi.object({
      question_text: Joi.string(),
      question_type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'essay'),
      points: Joi.number().integer().min(1),
      order_index: Joi.number().integer().min(0),
      media_url: Joi.string().uri().allow('', null),
      options: Joi.array().items(
        Joi.object({
          id: Joi.number().integer(),
          text: Joi.string().required(),
          is_correct: Joi.boolean().required(),
        })
      ),
      answer_key: Joi.string().allow('', null),
      word_limit: Joi.number().integer().min(0).allow(null),
    }).min(1), // At least one field must be provided
  },

  deleteQuestion: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
      questionId: Joi.number().integer().required(),
    }),
  },

  saveAnswer: {
    body: Joi.object({
      optionId: Joi.number().integer(),
      textResponse: Joi.string(),
    }).xor('optionId', 'textResponse'),
    params: Joi.object({
      submissionId: Joi.number().integer().required(),
      questionId: Joi.number().integer().required(),
    }),
  },

  startSubmission: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
  },

  submitAssessment: {
    params: Joi.object({
      submissionId: Joi.number().integer().required(),
    }),
  },

  gradeSubmission: {
    body: Joi.object({
      grades: Joi.array()
        .items(
          Joi.object({
            questionId: Joi.number().integer().required(),
            points: Joi.number().integer().min(0).required(),
            feedback: Joi.string().allow('', null),
          })
        )
        .required(),
      feedback: Joi.string().allow('', null),
    }),
    params: Joi.object({
      submissionId: Joi.number().integer().required(),
    }),
  },

  getAssessmentById: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
    query: Joi.object({
      includeQuestions: Joi.boolean().default(false),
      teacherView: Joi.boolean().default(false),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  },

  getSubmissionsForAssessment: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
  },

  getAssessmentsForCourse: {
    params: Joi.object({
      courseId: Joi.number().integer().required(),
    }),
    query: Joi.object({
      includeQuestions: Joi.boolean().default(false),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  },

  getStudentSubmission: {
    params: Joi.object({
      assessmentId: Joi.number().integer().required(),
    }),
    query: Joi.object({
      includeAnswers: Joi.boolean().default(false),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  },

  getSubmissionById: {
    params: Joi.object({
      submissionId: Joi.number().integer().required(),
    }),
    query: Joi.object({
      includeAnswers: Joi.boolean().default(true),
    }),
  },
}

import { handleControllerError } from '../utils/errorHandler.js'
import AssessmentService from '../services/assessmentService.js'
import {
  Assessment,
  Question,
  QuestionOption,
  Submission,
  AnswerResponse,
  Module,
  User,
  Course,
  Content,
  ModuleGrade,
} from '../models/index.js'

const assessmentService = new AssessmentService(
  Assessment,
  Question,
  QuestionOption,
  Submission,
  AnswerResponse,
  Module,
  User,
  Course,
  Content,
  ModuleGrade
);

export const createAssessment = async (req, res) => {
  try {
    const assessment = await assessmentService.createAssessment(req.body)
    res.status(201).json({
      success: true,
      assessment,
    })
  } catch (error) {
    handleControllerError(error, res, 'Create assessment', 'Error creating assessment')
  }
}

export const getAssessmentById = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const includeQuestions = req.query.includeQuestions === 'true'
    const teacherView = req.query.teacherView === 'true'
    const assessment = await assessmentService.getAssessmentById(
      assessmentId,
      includeQuestions,
      teacherView
    )
    res.status(200).json({
      success: true,
      assessment,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get assessment by id', 'Error getting assessment')
  }
}

export const getAssessmentsForModule = async (req, res) => {
  try {
    const { moduleId } = req.params
    const includeQuestions = req.query.includeQuestions === 'true'
    const assessments = await assessmentService.getAssessmentsForModule(moduleId, includeQuestions)
    res.status(200).json({
      success: true,
      assessments,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get assessments for module', 'Error getting assessments')
  }
}

export const addQuestion = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const question = await assessmentService.addQuestion(assessmentId, req.body)
    res.status(201).json({
      success: true,
      question,
    })
  } catch (error) {
    handleControllerError(error, res, 'Add question', 'Error adding question')
  }
}

export const startSubmission = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const userId = req.user.id
    const submission = await assessmentService.startSubmission(assessmentId, userId)
    res.status(201).json({
      success: true,
      submission,
    })
  } catch (error) {
    handleControllerError(error, res, 'Start submission', 'Error starting submission')
  }
}

export const saveAnswer = async (req, res) => {
  try {
    const { submissionId, questionId } = req.params
    const answer = await assessmentService.saveAnswer(submissionId, questionId, req.body)
    res.status(200).json({
      success: true,
      answer,
    })
  } catch (error) {
    handleControllerError(error, res, 'Save answer', 'Error saving answer')
  }
}

export const submitAssessment = async (req, res) => {
  try {
    const { submissionId } = req.params
    const userId = req.user.id
    const submission = await assessmentService.submitAssessment(submissionId, userId)
    res.status(200).json({
      success: true,
      submission,
    })
  } catch (error) {
    handleControllerError(error, res, 'Submit assessment', 'Error submitting assessment')
  }
}

export const getSubmissionsForAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const submissions = await assessmentService.getSubmissionsForAssessment(assessmentId)
    res.status(200).json({
      success: true,
      submissions,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get submissions for assessment', 'Error getting submissions')
  }
}

export const getStudentSubmissions = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const userId = req.user.id
    const includeAnswers = req.query.includeAnswers === 'true'
    const submissions = await assessmentService.getStudentSubmissions(
      assessmentId,
      userId,
      includeAnswers
    )
    res.status(200).json({
      success: true,
      submissions,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get student submissions', 'Error getting student submissions')
  }
}

export const getStudentSubmission = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const userId = req.user.id
    const includeAnswers = req.query.includeAnswers === 'true'
    const submission = await assessmentService.getStudentSubmission(
      assessmentId,
      userId,
      includeAnswers
    )
    res.status(200).json({
      success: true,
      submission,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get student submission', 'Error getting student submission')
  }
}

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params
    const { grade, feedback } = req.body
    const submission = await assessmentService.gradeSubmission(submissionId, grade, feedback)
    res.status(200).json({
      success: true,
      submission,
    })
  } catch (error) {
    handleControllerError(error, res, 'Grade submission', 'Error grading submission')
  }
}

export const updateAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params
    const assessment = await assessmentService.updateAssessment(assessmentId, req.body)
    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      assessment,
    })
  } catch (error) {
    handleControllerError(error, res, 'Update assessment', 'Error updating assessment')
  }
}

export const deleteAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.params
    await assessmentService.deleteAssessment(assessmentId)
    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully',
    })
  } catch (error) {
    handleControllerError(error, res, 'Delete assessment', 'Error deleting assessment')
  }
}

export const updateQuestion = async (req, res) => {
  try {
    const { assessmentId, questionId } = req.params
    const question = await assessmentService.updateQuestion(assessmentId, questionId, req.body)
    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question,
    })
  } catch (error) {
    handleControllerError(error, res, 'Update question', 'Error updating question')
  }
}

export const deleteQuestion = async (req, res) => {
  try {
    const { assessmentId, questionId } = req.params
    await assessmentService.deleteQuestion(assessmentId, questionId)
    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    })
  } catch (error) {
    handleControllerError(error, res, 'Delete question', 'Error deleting question')
  }
}

export const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params
    const submission = await assessmentService.getSubmissionById(submissionId)

    res.status(200).json({
      success: true,
      submission,
    })
  } catch (error) {
    handleControllerError(error, res, 'Get submission', 'Error retrieving submission')
  }
}

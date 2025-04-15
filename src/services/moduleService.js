import { log } from '../utils/logger.js'
import path from 'path'
import fs from 'fs'

/**
 * ModuleService
 *
 * This service handles operations related to course modules, including:
 * - Creating new modules for a given course
 * - Retrieving modules by ID or course association
 * - Updating module details
 * - Deleting modules
 * - Adding contents
 * - Updating contents
 * - Deleting contents
 * - Retrieving contents by module association
 * - Retrieving module grade of a user
 *
 * @class ModuleService
 * @requires log - A logging utility for error reporting
 */
class ModuleService {
  /**
   * Creates an instance of ModuleService.
   *
   * @param {Object} moduleModel - The model representing modules.
   * @param {Object} courseModel - The model representing courses.
   * @param {Object} contentModel - The model representing contents.
   * @param {Object} assessmentModel - The model representing assessments.
   * @param {Object} submissionModel - The model representing submissions.
   * @param {Object} moduleGradeModel - The model representing modulegrades.
   * @param {Object} userModel - The model representing users.
   */
  constructor(
    moduleModel,
    courseModel,
    contentModel,
    assessmentModel,
    submissionModel,
    moduleGradeModel,
    userModel
  ) {
    this.moduleModel = moduleModel
    this.courseModel = courseModel
    this.contentModel = contentModel
    this.assessmentModel = assessmentModel
    this.submissionModel = submissionModel
    this.moduleGradeModel = moduleGradeModel
    this.userModel = userModel
  }

  /**
   * Creates a new module under a specified course.
   *
   * @async
   * @param {number|string} courseId - The ID of the course the module belongs to.
   * @param {string} name - The name of the module (required, max 255 chars).
   * @param {string} [description] - The description of the module.
   * @returns {Promise<Object>} The newly created module.
   * @throws {Error} When the course is not found or validation fails.
   */
  async createModule(courseId, name, description) {
    try {
      const course = await this.courseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      const moduleData = {
        name,
        description: description || null,
        course_id: courseId,
      }

      if (!name) {
        throw new Error('Module name is required')
      }

      if (name.length > 255) {
        throw new Error('Module name is too long')
      }

      const newModule = await this.moduleModel.create(moduleData)
      return newModule
    } catch (error) {
      log.error('Error creating module:', error)
      if (
        error.message === 'Course not found' ||
        error.message === 'Module name is required' ||
        error.message === 'Module name is too long'
      ) {
        throw error
      }

      if (error.name === 'SequelizeValidationError') {
        throw error
      }

      throw new Error('Failed to create module')
    }
  }

  /**
   * Retrieves a module by its ID.
   *
   * @async
   * @param {number|string} moduleId - The unique identifier of the module.
   * @returns {Promise<Object>} The module object.
   * @throws {Error} When the module is not found.
   */
  async getModuleById(moduleId) {
    try {
      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      return module
    } catch (error) {
      log.error('Error getting module:', error)

      if (error.message === 'Module not found') {
        throw error
      }

      throw new Error('Failed to get module')
    }
  }

  /**
   * Retrieves all modules associated with a given course.
   *
   * @async
   * @param {number|string} courseId - The ID of the course.
   * @returns {Promise<Array<Object>>} An array of module objects.
   */
  async getModulesByCourseId(courseId) {
    try {
      const course = await this.courseModel.findByPk(courseId)
      if (!course) {
        throw new Error('Course not found')
      }

      return await this.moduleModel.findAll({
        where: { course_id: courseId },
      })
    } catch (error) {
      log.error('Error getting modules:', error)

      if (error.message === 'Course not found') {
        throw error
      }

      throw new Error('Failed to get modules')
    }
  }

  /**
   * Updates a module's details.
   *
   * @async
   * @param {number|string} moduleId - The ID of the module to update.
   * @param {string} name - The new name of the module (required, max 255 chars).
   * @param {string} [description] - The new description of the module.
   * @returns {Promise<Object>} The updated module.
   * @throws {Error} When validation fails or the module is not found.
   */
  async updateModule(moduleId, name, description) {
    try {
      if (!name) {
        throw new Error('Module name is required')
      }

      if (name.length > 255) {
        throw new Error('Module name is too long')
      }

      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      module.name = name
      module.description = description

      await module.save()
      return module
    } catch (error) {
      log.error('Error updating module:', error)

      if (
        error.message === 'Module not found' ||
        error.message === 'Module name is required' ||
        error.message === 'Module name is too long'
      ) {
        throw error
      }

      if (error.name === 'SequelizeValidationError') {
        throw error
      }

      throw new Error('Failed to update module')
    }
  }

  /**
   * Deletes a module by its ID.
   *
   * @async
   * @param {number|string} moduleId - The ID of the module to delete.
   * @returns {Promise<Object>} A confirmation message.
   * @throws {Error} When the module is not found or deletion fails.
   */
  async deleteModule(moduleId) {
    try {
      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }
      await module.destroy()
      return { message: 'Module deleted successfully' }
    } catch (error) {
      log.error(`Error deleting module with ID ${moduleId}:`, error)

      if (error.message === 'Module not found') {
        throw error
      }

      throw new Error('Failed to delete module')
    }
  }

  /**
   * Adds content to a specified module.
   *
   * @async
   * @param {number|string} moduleId - The ID of the module to which content is being added.
   * @param {string} name - The name of the content (required, max 255 chars).
   * @param {string} link - The URL of the content (must be a valid URL).
   * @returns {Promise<Object>} The newly created content.
   * @throws {Error} When the module is not found or validation fails.
   */
  async addModuleContent(moduleId, name, link) {
    try {
      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      const contentData = {
        name,
        link,
        module_id: moduleId,
      }

      if (!name) {
        throw new Error('Content name is required')
      }

      if (name.length > 255) {
        throw new Error('Content name is too long')
      }

      if (!link) {
        throw new Error('Content link is required')
      }

      try {
        new URL(link)
      } catch (_) {
        throw new Error('Content link is invalid')
      }

      const newContent = await this.contentModel.create(contentData)
      return newContent
    } catch (error) {
      log.error(`Error adding content:`, error)

      if (
        error.message === 'Module not found' ||
        error.message === 'Content name is required' ||
        error.message === 'Content name is too long' ||
        error.message === 'Content link is required' ||
        error.message === 'Content link is invalid'
      ) {
        throw error
      }

      throw new Error('Failed to add content')
    }
  }

  /**
   * Adds file-based content to a specified module.
   * Stores file metadata and a relative URL path in the Content model.
   *
   * @async
   * @param {number|string} moduleId - The ID of the module.
   * @param {string} [name] - Optional name for the content item. Defaults to the original filename.
   * @param {object} fileData - Object containing file details from multer (originalName, fileName, path, mimeType, size).
   * @returns {Promise<Object>} The newly created content record.
   * @throws {Error} When the module is not found or validation/creation fails.
   */
  async addModuleFileContent(moduleId, name, fileData) {
    try {
      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      const contentName = name || fileData.originalName // Use provided name or default to original filename

      if (!contentName) {
        throw new Error('Content name is required (either provide one or ensure file has a name)')
      }
      if (contentName.length > 255) {
        throw new Error('Content name is too long')
      }

      const contentLink = `/uploads/${fileData.fileName}`

      const contentRecordData = {
        name: contentName,
        link: contentLink, // Store the relative URL path
        module_id: moduleId,
      }

      const newContent = await this.contentModel.create(contentRecordData)
      return newContent
    } catch (error) {
      log.error(`Error adding file content to module ${moduleId}:`, error)

      if (
        error.message === 'Module not found' ||
        error.message.includes('Content name is required') ||
        error.message.includes('Content name is too long') ||
        error.name === 'SequelizeValidationError'
      ) {
        throw error // Re-throw specific validation errors
      }

      throw new Error('Failed to add file content') // Generic fallback error
    }
  }

  /**
   * Updates an existing module content.
   *
   * @async
   * @param {number|string} contentId - The ID of the content to update.
   * @param {string} name - The updated name of the content (required, max 255 chars).
   * @param {string} link - The updated URL of the content (must be a valid URL).
   * @returns {Promise<Object>} The updated content.
   * @throws {Error} When the content is not found or validation fails.
   */
  async updateModuleContent(contentId, name, link) {
    try {
      if (!name) {
        throw new Error('Content name is required')
      }

      if (name.length > 255) {
        throw new Error('Content name is too long')
      }

      if (!link) {
        throw new Error('Content link is required')
      }

      try {
        new URL(link)
      } catch (_) {
        throw new Error('Content link is invalid')
      }

      const content = await this.contentModel.findByPk(contentId)
      if (!content) {
        throw new Error('Content not found')
      }

      content.name = name
      content.link = link

      await content.save()
      return content
    } catch (error) {
      log.error(`Error updating content:`, error)

      if (
        error.message === 'Content not found' ||
        error.message === 'Content name is required' ||
        error.message === 'Content name is too long' ||
        error.message === 'Content link is required' ||
        error.message === 'Content link is invalid'
      ) {
        throw error
      }

      throw new Error('Failed to update content')
    }
  }

  /**
   * Deletes a module content by its ID.
   *
   * @async
   * @param {number|string} contentId - The ID of the content to delete.
   * @returns {Promise<Object>} A confirmation message.
   * @throws {Error} When the content is not found or deletion fails.
   */
  async deleteModuleContent(contentId) {
    try {
      const content = await this.contentModel.findByPk(contentId)
      if (!content) {
        throw new Error('Content not found')
      }

      if (content.link && content.link.startsWith('/uploads/')) {
        const filename = path.basename(content.link) // Extract filename from URL path

        const UPLOAD_DIR = path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          '..',
          '..',
          'uploads'
        )
        const filePath = path.join(UPLOAD_DIR, filename)

        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath)
            log.info(`Deleted file associated with content ${contentId}: ${filePath}`)
          } catch (fileError) {
            log.error(`Failed to delete file ${filePath} for content ${contentId}:`, fileError)
          }
        } else {
          log.warn(
            `File path not found for content ${contentId}, link: ${content.link}, derived path: ${filePath}`
          )
        }
      }

      await content.destroy()
      return { message: 'Content deleted successfully' }
    } catch (error) {
      log.error(`Error deleting content with ID ${contentId}:`, error)
      if (error.message === 'Content not found') {
        throw error
      }
      throw new Error('Failed to delete content')
    }
  }

  /**
   * Retrieves all contents associated with a given module.
   *
   * @async
   * @param {number|string} moduleId - The ID of the module.
   * @returns {Promise<Array<Object>>} An array of content objects.
   * @throws {Error} When the module is not found.
   */
  async getContentsByModuleId(moduleId) {
    try {
      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      return await this.contentModel.findAll({
        where: { module_id: moduleId },
      })
    } catch (error) {
      log.error('Error getting contents:', error)

      if (error.message === 'Module not found') {
        throw error
      }

      throw new Error('Failed to get contents')
    }
  }

  /**
   * Retrieves the module grade of a user based on their highest graded submissions.
   *
   * @async
   * @param {number|string} id - The ID of the user.
   * @param {number|string} moduleId - The ID of the module.
   * @returns {Promise<Object>} An object containing:
   *   - `allGraded` {boolean} - Whether all assessments in the module have graded submissions.
   *   - `allPassed` {boolean} - Whether the user passed all assessments in the module.
   *   - `averageScore` {number} - The user's average score for the module.
   * @throws {Error} When the user or module is not found.
   * @throws {Error} When an unexpected error occurs.
   */
  async getModuleGradeOfUser(id, moduleId) {
    try {
      const user = await this.userModel.findByPk(id)
      if (!user) {
        throw new Error('User not found')
      }

      const module = await this.moduleModel.findByPk(moduleId)
      if (!module) {
        throw new Error('Module not found')
      }

      const assessments = await this.assessmentModel.findAll({
        where: { module_id: moduleId },
        attributes: ['id', 'passing_score', 'max_score'],
      })

      if (assessments.length === 0) {
        return { allGraded: true, allPassed: true, averageScore: 100 } // or false, false, 0?
      }

      const highestScoreSubmissions = await Promise.all(
        assessments.map(async (assessment) => {
          const highestSubmission = await this.submissionModel.findOne({
            where: {
              user_id: id,
              assessment_id: assessment.id,
              status: 'graded',
            },
            order: [['score', 'DESC']],
          })

          return highestSubmission
            ? {
                assessment_id: highestSubmission.assessment_id,
                score: highestSubmission.score,
                max_score: highestSubmission.max_score,
                passed: highestSubmission.score >= assessment.passing_score,
              }
            : null
        })
      )

      const validSubmissions = highestScoreSubmissions.filter((submission) => submission !== null)

      const allGraded = validSubmissions.length === assessments.length

      const allPassed = allGraded && validSubmissions.every((submission) => submission.passed)

      const totalScore = validSubmissions.reduce((sum, submission) => sum + submission.score, 0)
      const totalPossibleScore = assessments.reduce(
        (sum, assessment) => sum + assessment.max_score,
        0
      )

      const averageScore =
        validSubmissions.length > 0
          ? parseFloat(((totalScore / totalPossibleScore) * 100).toFixed(2))
          : 0

      await this.moduleGradeModel.upsert({
        user_id: id,
        module_id: moduleId,
        grade: averageScore,
      })

      return { allGraded, allPassed, averageScore, submissions: validSubmissions }
    } catch (error) {
      log.error('Error getting contents:', error)

      if (error.message === 'User not found') {
        throw error
      }

      if (error.message === 'Module not found') {
        throw error
      }

      throw new Error('Failed to get module grade')
    }
  }
}

export default ModuleService

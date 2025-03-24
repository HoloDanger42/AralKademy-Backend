import { log } from '../utils/logger.js'

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
   */
  constructor(moduleModel, courseModel, contentModel) {
    this.moduleModel = moduleModel
    this.courseModel = courseModel
    this.contentModel = contentModel
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
}

export default ModuleService

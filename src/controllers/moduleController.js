import ModuleService from '../services/moduleService.js'
import {
  Module,
  Course,
  Content,
  Assessment,
  Submission,
  ModuleGrade,
  User,
} from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

// Instantiate module service
const moduleService = new ModuleService(
  Module,
  Course,
  Content,
  Assessment,
  Submission,
  ModuleGrade,
  User
)

/**
 * Creates a new module.
 * @param {Object} req - The request object containing module details.
 * @param {Object} res - The response object.
 */
const createModule = async (req, res) => {
  try {
    const { courseId } = req.params
    const { name, description } = req.body
    const newModule = await moduleService.createModule(courseId, name, description)
    res.status(201).json({
      message: 'Module created successfully',
      module: newModule,
    })
    log.info(`Module ${newModule.name} was successfully created`)
  } catch (error) {
    return handleControllerError(error, res, 'Create module', 'Error creating module')
  }
}

/**
 * Retrieves a module by ID.
 * @param {Object} req - The request object containing the module ID in req.params.
 * @param {Object} res - The response object.
 */
const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params
    const module = await moduleService.getModuleById(moduleId)
    res.status(200).json(module)
    log.info(`Module ${moduleId} retrieved successfully`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Get module by ID ${req.params.moduleId}`,
      'Error fetching module'
    )
  }
}

/**
 * Retrieves all modules for a given course ID.
 * @param {Object} req - The request object containing the course ID in req.params.
 * @param {Object} res - The response object.
 */
const getModulesByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params
    const modules = await moduleService.getModulesByCourseId(courseId)
    res.status(200).json(modules)
    log.info(`Modules retrieved successfully`)
  } catch (error) {
    return handleControllerError(error, res, 'Get modules by course ID', 'Error fetching modules')
  }
}

/**
 * Updates a module.
 * @param {Object} req - The request object containing the module ID and updated details in req.params.
 * @param {Object} res - The response object.
 */
const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name, description } = req.body
    const updatedModule = await moduleService.updateModule(moduleId, name, description)
    res.status(200).json({
      message: 'Module updated successfully',
      module: updatedModule,
    })
    log.info(`Module ${updatedModule.name} was successfully updated`)
  } catch (error) {
    return handleControllerError(error, res, 'Update module', 'Error updating module')
  }
}

/**
 * Deletes a module.
 * @param {Object} req - The request object containing the module ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params
    const deletedModule = await moduleService.deleteModule(moduleId)
    res.status(200).json({
      message: 'Module deleted successfully',
      module: deletedModule,
    })
    log.info(`Module ${moduleId} was successfully deleted`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete module ${req.params.moduleId}`,
      'Error deleting module'
    )
  }
}

/**
 * Adds new content to a module.
 * @param {Object} req - The request object containing the module ID in req.params and content details in req.body.
 * @param {Object} res - The response object.
 */
const addModuleContent = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name, link, text } = req.body
    const newContent = await moduleService.addModuleContent(moduleId, name, link, text)
    res.status(201).json({
      message: 'Content added successfully',
      content: newContent,
    })
    log.info(`Content ${newContent.name} was successfully added`)
  } catch (error) {
    return handleControllerError(error, res, 'Add content', 'Error adding content')
  }
}

/**
 * Adds new file content to a module. Handles file upload via multer.
 * @param {Object} req - The request object containing the module ID in req.params, file details in req.file, and optional name in req.body.
 * @param {Object} res - The response object.
 */
const addModuleFileContent = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name } = req.body // Optional name from form data
    const file = req.file // File object added by multer

    if (!file) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No file uploaded or invalid file type/size.',
        },
      })
    }

    // Prepare data for the service
    const contentData = {
      originalName: file.originalName,
      fileName: file.filename, // Unique name generated by multer config
      path: file.path, // Path where the file is stored
      mimeType: file.mimetype,
      size: file.size,
    }

    // Call the service method to create the content record
    const newContent = await moduleService.addModuleFileContent(moduleId, name, contentData)

    res.status(201).json({
      message: 'File uploaded and content created successfully',
      content: newContent,
    })
    log.info(
      `File content ${newContent.name || file.originalName} was successfully added to module ${moduleId}`
    )
  } catch (error) {
    return handleControllerError(error, res, 'Add file content', 'Error adding file content')
  }
}

/**
 * Updates content in a module.
 * @param {Object} req - The request object containing the content ID in req.params and updated details in req.body.
 * @param {Object} res - The response object.
 */
const updateModuleContent = async (req, res) => {
  try {
    const { contentId } = req.params
    const { name, link, text } = req.body
    const updatedContent = await moduleService.updateModuleContent(contentId, name, link, text)
    res.status(200).json({
      message: 'Content updated successfully',
      content: updatedContent,
    })
    log.info(`Content ${updatedContent.name} was successfully updated`)
  } catch (error) {
    return handleControllerError(error, res, 'Update content', 'Error updating content')
  }
}

/**
 * Deletes content from a module.
 * @param {Object} req - The request object containing the content ID in req.params.
 * @param {Object} res - The response object.
 */
const deleteModuleContent = async (req, res) => {
  try {
    const { contentId } = req.params
    const deletedContent = await moduleService.deleteModuleContent(contentId)
    res.status(200).json({
      message: 'Content deleted successfully',
      content: deletedContent,
    })
    log.info(`Content ${contentId} was successfully deleted`)
  } catch (error) {
    return handleControllerError(
      error,
      res,
      `Delete content ${req.params.contentId}`,
      'Error deleting content'
    )
  }
}

/**
 * Retrieves all contents for a given module ID.
 * @param {Object} req - The request object containing the module ID in req.params.
 * @param {Object} res - The response object.
 */
const getContentsByModuleId = async (req, res) => {
  try {
    const { moduleId } = req.params
    const contents = await moduleService.getContentsByModuleId(moduleId)
    res.status(200).json(contents)
    log.info(`Contents retrieved successfully`)
  } catch (error) {
    return handleControllerError(error, res, 'Get contents by module ID', 'Error fetching contents')
  }
}

/**
 * Retrieves a module grade of a user.
 * @param {Object} req - The request object containing the user ID and module ID in req.params.
 * @param {Object} res - The response object.
 */
const getModuleGradeOfUser = async (req, res) => {
  try {
    const { moduleId } = req.params
    const id = req.user.id
    const moduleGrade = await moduleService.getModuleGradeOfUser(id, moduleId)
    res.status(200).json(moduleGrade)
    log.info('Module grade retrieved successfully')
  } catch (error) {
    return handleControllerError(
      error,
      res,
      'Get module grade of user',
      'Error fetching module grade'
    )
  }
}

export {
  createModule,
  getModuleById,
  getModulesByCourseId,
  updateModule,
  deleteModule,
  addModuleContent,
  addModuleFileContent,
  updateModuleContent,
  deleteModuleContent,
  getContentsByModuleId,
  getModuleGradeOfUser,
}

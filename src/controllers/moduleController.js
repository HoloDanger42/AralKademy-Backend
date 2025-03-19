import ModuleService from '../services/moduleService.js'
import { Module, Course } from '../models/index.js'
import { log } from '../utils/logger.js'
import { handleControllerError } from '../utils/errorHandler.js'

// Instantiate module service
const moduleService = new ModuleService(Module, Course)

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
          course: deletedModule,
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

export {
    createModule,
    getModuleById,
    getModulesByCourseId,
    updateModule,
    deleteModule
}

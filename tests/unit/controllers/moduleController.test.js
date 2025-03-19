import { jest } from '@jest/globals'
import {
  createModule,
  getModuleById,
  getModulesByCourseId,
  updateModule,
  deleteModule,
  addModuleContent,
  updateModuleContent,
  deleteModuleContent,
  getContentsByModuleId,
} from '../../../src/controllers/moduleController.js'
import ModuleService from '../../../src/services/moduleService.js'
import { log } from '../../../src/utils/logger.js'

describe('Module Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = { body: {}, params: {} }
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    jest.spyOn(log, 'info')
    jest.spyOn(log, 'error')
    jest.clearAllMocks()
  })

  describe('createModule', () => {
    test('should create a module successfully', async () => {
      mockReq.params.courseId = 1
      mockReq.body = { name: 'Module 1', description: 'Module Description' }
      const mockModule = { id: 1, ...mockReq.body }
      jest.spyOn(ModuleService.prototype, 'createModule').mockResolvedValue(mockModule)

      await createModule(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Module created successfully',
        module: mockModule,
      })
      expect(log.info).toHaveBeenCalledWith('Module Module 1 was successfully created')
    })

    test('should handle errors when creating a module', async () => {
      mockReq.params.courseId = 1
      mockReq.body = { name: 'Module 1', description: 'Module Description' }
      jest.spyOn(ModuleService.prototype, 'createModule').mockRejectedValue(new Error('Error creating module'))

      await createModule(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error creating module',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Create module error:', expect.any(Error))
    })
  })

  describe('updateModule', () => {
    test('should update a module successfully', async () => {
      mockReq.params.moduleId = 1
      mockReq.body = { name: 'Updated Module', description: 'Updated Description' }
      const mockModule = { id: 1, ...mockReq.body }
      jest.spyOn(ModuleService.prototype, 'updateModule').mockResolvedValue(mockModule)

      await updateModule(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Module updated successfully',
        module: mockModule,
      })
      expect(log.info).toHaveBeenCalledWith('Module Updated Module was successfully updated')
    })

    test('should handle errors when updating a module', async () => {
        mockReq.params.moduleId = 1
        mockReq.body = { name: 'Updated Module', description: 'Updated Description' }
        jest.spyOn(ModuleService.prototype, 'updateModule').mockRejectedValue(new Error('Error updating module'))
      
        await updateModule(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error updating module',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Update module error:', expect.any(Error))
      })      
  })

  describe('deleteModule', () => {
    test('should delete a module successfully', async () => {
      mockReq.params.moduleId = 1
      const mockModule = { id: 1, name: 'Module 1' }
      jest.spyOn(ModuleService.prototype, 'deleteModule').mockResolvedValue(mockModule)

      await deleteModule(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Module deleted successfully',
        module: mockModule,
      })
      expect(log.info).toHaveBeenCalledWith('Module 1 was successfully deleted')
    })

    test('should handle errors when deleting a module', async () => {
        mockReq.params.moduleId = 1
        jest.spyOn(ModuleService.prototype, 'deleteModule').mockRejectedValue(new Error('Error deleting module'))
      
        await deleteModule(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error deleting module',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Delete module 1 error:', expect.any(Error))
      })      
  })

  describe('addModuleContent', () => {
    test('should add content to a module successfully', async () => {
      mockReq.params.moduleId = 1
      mockReq.body = { name: 'Content 1', link: 'http://example.com' }
      const mockContent = { id: 1, ...mockReq.body }
      jest.spyOn(ModuleService.prototype, 'addModuleContent').mockResolvedValue(mockContent)

      await addModuleContent(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(201)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Content added successfully',
        content: mockContent,
      })
      expect(log.info).toHaveBeenCalledWith('Content Content 1 was successfully added')
    })

    test('should handle errors when adding content to a module', async () => {
        mockReq.params.moduleId = 1
        mockReq.body = { name: 'Content 1', link: 'http://example.com' }
        jest.spyOn(ModuleService.prototype, 'addModuleContent').mockRejectedValue(new Error('Error adding content'))
      
        await addModuleContent(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error adding content',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Add content error:', expect.any(Error))
      })      
  })

  describe('updateModuleContent', () => {
    test('should update module content successfully', async () => {
      mockReq.params.contentId = 1
      mockReq.body = { name: 'Updated Content', link: 'http://updated.com' }
      const mockContent = { id: 1, ...mockReq.body }
      jest.spyOn(ModuleService.prototype, 'updateModuleContent').mockResolvedValue(mockContent)

      await updateModuleContent(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Content updated successfully',
        content: mockContent,
      })
      expect(log.info).toHaveBeenCalledWith('Content Updated Content was successfully updated')
    })

    test('should handle errors when updating module content', async () => {
        mockReq.params.contentId = 1
        mockReq.body = { name: 'Updated Content', link: 'http://updated.com' }
        jest.spyOn(ModuleService.prototype, 'updateModuleContent').mockRejectedValue(new Error('Error updating content'))
      
        await updateModuleContent(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error updating content',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Update content error:', expect.any(Error))
      })      
  })

  describe('deleteModuleContent', () => {
    test('should delete module content successfully', async () => {
      mockReq.params.contentId = 1
      const mockContent = { id: 1, name: 'Content 1' }
      jest.spyOn(ModuleService.prototype, 'deleteModuleContent').mockResolvedValue(mockContent)

      await deleteModuleContent(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Content deleted successfully',
        content: mockContent,
      })
      expect(log.info).toHaveBeenCalledWith('Content 1 was successfully deleted')
    })

    test('should handle errors when deleting module content', async () => {
        mockReq.params.contentId = 1
        jest.spyOn(ModuleService.prototype, 'deleteModuleContent').mockRejectedValue(new Error('Error deleting content'))
      
        await deleteModuleContent(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error deleting content',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Delete content 1 error:', expect.any(Error))
      })      
  })

  describe('getContentsByModuleId', () => {
    test('should retrieve contents by module ID successfully', async () => {
      mockReq.params.moduleId = 1
      const mockContents = [{ id: 1, name: 'Content 1' }, { id: 2, name: 'Content 2' }]
      jest.spyOn(ModuleService.prototype, 'getContentsByModuleId').mockResolvedValue(mockContents)

      await getContentsByModuleId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockContents)
      expect(log.info).toHaveBeenCalledWith('Contents retrieved successfully')
    })

    test('should handle errors when fetching contents by module ID', async () => {
        mockReq.params.moduleId = 1
        jest.spyOn(ModuleService.prototype, 'getContentsByModuleId').mockRejectedValue(new Error('Error fetching contents'))
      
        await getContentsByModuleId(mockReq, mockRes)
      
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({
          error: {
            message: 'Error fetching contents',
            code: 'INTERNAL_ERROR',
          },
        })
        expect(log.error).toHaveBeenCalledWith('Get contents by module ID error:', expect.any(Error))
      })      
  })

  describe('getModuleById', () => {
    test('should retrieve a module successfully', async () => {
      mockReq.params.moduleId = 1
      const mockModule = { id: 1, name: 'Module 1' }
      jest.spyOn(ModuleService.prototype, 'getModuleById').mockResolvedValue(mockModule)
  
      await getModuleById(mockReq, mockRes)
  
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockModule)
      expect(log.info).toHaveBeenCalledWith('Module 1 retrieved successfully')
    })
  
    test('should handle errors when retrieving a module', async () => {
      mockReq.params.moduleId = 1
      jest.spyOn(ModuleService.prototype, 'getModuleById').mockRejectedValue(new Error('Error fetching module'))
  
      await getModuleById(mockReq, mockRes)
  
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error fetching module',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module by ID 1 error:', expect.any(Error))
    })
  })
  
  describe('getModulesByCourseId', () => {
    test('should retrieve all modules for a course', async () => {
      mockReq.params.courseId = 1
      const mockModules = [{ id: 1, name: 'Module 1' }, { id: 2, name: 'Module 2' }]
      jest.spyOn(ModuleService.prototype, 'getModulesByCourseId').mockResolvedValue(mockModules)
  
      await getModulesByCourseId(mockReq, mockRes)
  
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockModules)
      expect(log.info).toHaveBeenCalledWith('Modules retrieved successfully')
    })
  
    test('should handle errors when retrieving modules', async () => {
      mockReq.params.courseId = 1
      jest.spyOn(ModuleService.prototype, 'getModulesByCourseId').mockRejectedValue(new Error('Error fetching modules'))
  
      await getModulesByCourseId(mockReq, mockRes)
  
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error fetching modules',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get modules by course ID error:', expect.any(Error))
    })
  })  
})

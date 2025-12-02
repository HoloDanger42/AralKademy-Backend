<<<<<<< HEAD
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
  getModuleGradeOfUser,
  unlockNextModuleForLearner,
} from '../../../src/controllers/moduleController.js'
import ModuleService from '../../../src/services/moduleService.js'
import { log } from '../../../src/utils/logger.js'

describe('Module Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = { body: {}, params: {}, user: { id: 1 } }
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
      jest
        .spyOn(ModuleService.prototype, 'createModule')
        .mockRejectedValue(new Error('Error creating module'))

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
      jest
        .spyOn(ModuleService.prototype, 'updateModule')
        .mockRejectedValue(new Error('Error updating module'))

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
      jest
        .spyOn(ModuleService.prototype, 'deleteModule')
        .mockRejectedValue(new Error('Error deleting module'))

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
      jest
        .spyOn(ModuleService.prototype, 'addModuleContent')
        .mockRejectedValue(new Error('Error adding content'))

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
      jest
        .spyOn(ModuleService.prototype, 'updateModuleContent')
        .mockRejectedValue(new Error('Error updating content'))

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
      jest
        .spyOn(ModuleService.prototype, 'deleteModuleContent')
        .mockRejectedValue(new Error('Error deleting content'))

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
      const mockContents = [
        { id: 1, name: 'Content 1' },
        { id: 2, name: 'Content 2' },
      ]
      jest.spyOn(ModuleService.prototype, 'getContentsByModuleId').mockResolvedValue(mockContents)

      await getContentsByModuleId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockContents)
      expect(log.info).toHaveBeenCalledWith('Contents retrieved successfully')
    })

    test('should handle errors when fetching contents by module ID', async () => {
      mockReq.params.moduleId = 1
      jest
        .spyOn(ModuleService.prototype, 'getContentsByModuleId')
        .mockRejectedValue(new Error('Error fetching contents'))

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
      jest
        .spyOn(ModuleService.prototype, 'getModuleById')
        .mockRejectedValue(new Error('Error fetching module'))

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
      const mockModules = [
        { id: 1, name: 'Module 1' },
        { id: 2, name: 'Module 2' },
      ]
      jest.spyOn(ModuleService.prototype, 'getModulesByCourseId').mockResolvedValue(mockModules)

      await getModulesByCourseId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockModules)
      expect(log.info).toHaveBeenCalledWith('Modules retrieved successfully')
    })

    test('should handle errors when retrieving modules', async () => {
      mockReq.params.courseId = 1
      jest
        .spyOn(ModuleService.prototype, 'getModulesByCourseId')
        .mockRejectedValue(new Error('Error fetching modules'))

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

  describe('getModuleGradeOfUser', () => {
    test('should retrieve module grade successfully', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const mockGrade = {
        allGraded: true,
        allPassed: true,
        averageScore: 90,
      }
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockResolvedValue(mockGrade)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockGrade)
      expect(log.info).toHaveBeenCalledWith('Module grade retrieved successfully')
    })

    test('should handle user not found error', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('User not found')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle module not found error', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('Module not found')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Module not found',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle generic errors', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('Database error')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error fetching module grade',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle missing parameters', async () => {
      mockReq.query = {} // Missing userId
      mockReq.params = {} // Missing moduleId
      const error = new Error('Missing required parameters')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Missing required parameters',
          code: 'VALIDATION_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Get module grade of user error:',
        expect.objectContaining({
          message: 'Missing required parameters',
        })
      )
    })
  })

  describe('unlockNextModuleForLearner', () => {
    test('should unlock the next module successfully', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const mockResult = {
        message: 'Next module unlocked successfully.',
        unlockedModule: { module_id: 3, name: 'Module 3' },
        override: {
          id: 1,
          user_id: 1,
          unlocked_module_id: 3,
          course_id: 1,
          overridden_by_user_id: 3,
        },
      }

      jest
        .spyOn(ModuleService.prototype, 'unlockNextModuleForLearner')
        .mockResolvedValue(mockResult)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(ModuleService.prototype.unlockNextModuleForLearner).toHaveBeenCalledWith(
        1, // learnerId as number
        2, // currentModuleId as number
        3, // teacherId
        'Student completed alternative assessment' // reason
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockResult.message,
        unlockedModule: mockResult.unlockedModule,
        override: mockResult.override,
      })
      expect(log.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Teacher 3 initiated unlock for next module after module 2 for learner 1'
        )
      )
    })

    test('should return appropriate response when module is already unlocked', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const mockResult = {
        message: 'Next module already manually unlocked.',
        unlockedModule: { module_id: 3, name: 'Module 3' },
        override: {
          id: 5,
          user_id: 1,
          unlocked_module_id: 3,
          course_id: 1,
          overridden_by_user_id: 3,
          reason: 'Previously unlocked',
          createdAt: new Date('2023-01-01'),
        },
      }

      jest
        .spyOn(ModuleService.prototype, 'unlockNextModuleForLearner')
        .mockResolvedValue(mockResult)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockResult.message,
        unlockedModule: mockResult.unlockedModule,
        override: mockResult.override,
      })
    })

    test('should handle case when user is not authenticated', async () => {
      // Setup - user not authenticated
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = {} // No ID

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(ModuleService.prototype.unlockNextModuleForLearner).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'User not authenticated or user ID not found.',
        },
      })
    })

    test('should handle learner not found error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Learner not found or invalid role.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Learner not found or invalid role.',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        expect.stringContaining('Unlock next module for learner'),
        expect.any(Error)
      )
    })

    test('should handle module not found error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Current module not found.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Current module not found.',
          code: 'NOT_FOUND',
        },
      })
    })

    test('should handle last module error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '3', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Current module is already the last module.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Current module is already the last module.',
          code: 'VALIDATION_ERROR',
        },
      })
    })

    test('should handle generic errors', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Database error')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error unlocking next module',
          code: 'INTERNAL_ERROR',
        },
      })
    })
  })
})
=======
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
  getModuleGradeOfUser,
  unlockNextModuleForLearner,
} from '../../../src/controllers/moduleController.js'
import ModuleService from '../../../src/services/moduleService.js'
import { log } from '../../../src/utils/logger.js'

describe('Module Controller', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = { body: {}, params: {}, user: { id: 1 } }
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
      jest
        .spyOn(ModuleService.prototype, 'createModule')
        .mockRejectedValue(new Error('Error creating module'))

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
      jest
        .spyOn(ModuleService.prototype, 'updateModule')
        .mockRejectedValue(new Error('Error updating module'))

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
      jest
        .spyOn(ModuleService.prototype, 'deleteModule')
        .mockRejectedValue(new Error('Error deleting module'))

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
      jest
        .spyOn(ModuleService.prototype, 'addModuleContent')
        .mockRejectedValue(new Error('Error adding content'))

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
      jest
        .spyOn(ModuleService.prototype, 'updateModuleContent')
        .mockRejectedValue(new Error('Error updating content'))

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
      jest
        .spyOn(ModuleService.prototype, 'deleteModuleContent')
        .mockRejectedValue(new Error('Error deleting content'))

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
      const mockContents = [
        { id: 1, name: 'Content 1' },
        { id: 2, name: 'Content 2' },
      ]
      jest.spyOn(ModuleService.prototype, 'getContentsByModuleId').mockResolvedValue(mockContents)

      await getContentsByModuleId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockContents)
      expect(log.info).toHaveBeenCalledWith('Contents retrieved successfully')
    })

    test('should handle errors when fetching contents by module ID', async () => {
      mockReq.params.moduleId = 1
      jest
        .spyOn(ModuleService.prototype, 'getContentsByModuleId')
        .mockRejectedValue(new Error('Error fetching contents'))

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
      jest
        .spyOn(ModuleService.prototype, 'getModuleById')
        .mockRejectedValue(new Error('Error fetching module'))

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
      const mockModules = [
        { id: 1, name: 'Module 1' },
        { id: 2, name: 'Module 2' },
      ]
      jest.spyOn(ModuleService.prototype, 'getModulesByCourseId').mockResolvedValue(mockModules)

      await getModulesByCourseId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockModules)
      expect(log.info).toHaveBeenCalledWith('Modules retrieved successfully')
    })

    test('should handle errors when retrieving modules', async () => {
      mockReq.params.courseId = 1
      jest
        .spyOn(ModuleService.prototype, 'getModulesByCourseId')
        .mockRejectedValue(new Error('Error fetching modules'))

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

  describe('getModuleGradeOfUser', () => {
    test('should retrieve module grade successfully', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const mockGrade = {
        allGraded: true,
        allPassed: true,
        averageScore: 90,
      }
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockResolvedValue(mockGrade)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockGrade)
      expect(log.info).toHaveBeenCalledWith('Module grade retrieved successfully')
    })

    test('should handle user not found error', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('User not found')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle module not found error', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('Module not found')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Module not found',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle generic errors', async () => {
      mockReq.query = { id: '1' }
      mockReq.params = { moduleId: '1' }
      const error = new Error('Database error')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error fetching module grade',
          code: 'INTERNAL_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith('Get module grade of user error:', expect.any(Error))
    })

    test('should handle missing parameters', async () => {
      mockReq.query = {} // Missing userId
      mockReq.params = {} // Missing moduleId
      const error = new Error('Missing required parameters')
      jest.spyOn(ModuleService.prototype, 'getModuleGradeOfUser').mockRejectedValue(error)

      await getModuleGradeOfUser(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Missing required parameters',
          code: 'VALIDATION_ERROR',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        'Get module grade of user error:',
        expect.objectContaining({
          message: 'Missing required parameters',
        })
      )
    })
  })

  describe('unlockNextModuleForLearner', () => {
    test('should unlock the next module successfully', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const mockResult = {
        message: 'Next module unlocked successfully.',
        unlockedModule: { module_id: 3, name: 'Module 3' },
        override: {
          id: 1,
          user_id: 1,
          unlocked_module_id: 3,
          course_id: 1,
          overridden_by_user_id: 3,
        },
      }

      jest
        .spyOn(ModuleService.prototype, 'unlockNextModuleForLearner')
        .mockResolvedValue(mockResult)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(ModuleService.prototype.unlockNextModuleForLearner).toHaveBeenCalledWith(
        1, // learnerId as number
        2, // currentModuleId as number
        3, // teacherId
        'Student completed alternative assessment' // reason
      )
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockResult.message,
        unlockedModule: mockResult.unlockedModule,
        override: mockResult.override,
      })
      expect(log.info).toHaveBeenCalledWith(
        expect.stringContaining(
          'Teacher 3 initiated unlock for next module after module 2 for learner 1'
        )
      )
    })

    test('should return appropriate response when module is already unlocked', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const mockResult = {
        message: 'Next module already manually unlocked.',
        unlockedModule: { module_id: 3, name: 'Module 3' },
        override: {
          id: 5,
          user_id: 1,
          unlocked_module_id: 3,
          course_id: 1,
          overridden_by_user_id: 3,
          reason: 'Previously unlocked',
          createdAt: new Date('2023-01-01'),
        },
      }

      jest
        .spyOn(ModuleService.prototype, 'unlockNextModuleForLearner')
        .mockResolvedValue(mockResult)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mockResult.message,
        unlockedModule: mockResult.unlockedModule,
        override: mockResult.override,
      })
    })

    test('should handle case when user is not authenticated', async () => {
      // Setup - user not authenticated
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = {} // No ID

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(ModuleService.prototype.unlockNextModuleForLearner).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'FORBIDDEN',
          message: 'User not authenticated or user ID not found.',
        },
      })
    })

    test('should handle learner not found error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Learner not found or invalid role.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Learner not found or invalid role.',
          code: 'NOT_FOUND',
        },
      })
      expect(log.error).toHaveBeenCalledWith(
        expect.stringContaining('Unlock next module for learner'),
        expect.any(Error)
      )
    })

    test('should handle module not found error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Current module not found.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Current module not found.',
          code: 'NOT_FOUND',
        },
      })
    })

    test('should handle last module error', async () => {
      // Setup
      mockReq.params = { currentModuleId: '3', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Current module is already the last module.')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Current module is already the last module.',
          code: 'VALIDATION_ERROR',
        },
      })
    })

    test('should handle generic errors', async () => {
      // Setup
      mockReq.params = { currentModuleId: '2', learnerId: '1' }
      mockReq.body = { reason: 'Student completed alternative assessment' }
      mockReq.user = { id: 3 } // Teacher ID

      const error = new Error('Database error')
      jest.spyOn(ModuleService.prototype, 'unlockNextModuleForLearner').mockRejectedValue(error)

      // Execute
      await unlockNextModuleForLearner(mockReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Error unlocking next module',
          code: 'INTERNAL_ERROR',
        },
      })
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

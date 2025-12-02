<<<<<<< HEAD
import { beforeEach, describe, expect, jest } from '@jest/globals'
import ModuleService from '../../../src/services/moduleService'

describe('Module Service', () => {
  let moduleService
  let mockModuleModel
  let mockCourseModel
  let mockContentModel
  let mockAssessmentModel
  let mockSubmissionModel
  let mockModuleGradeModel
  let mockUserModel
  let mockModuleUnlockOverrideModel

  beforeEach(() => {
    mockModuleModel = {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }

    mockCourseModel = {
      findByPk: jest.fn(),
    }

    mockContentModel = {
      findByPk: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    }

    mockUserModel = {
      findByPk: jest.fn(),
    }

    mockAssessmentModel = {
      findAll: jest.fn(),
    }

    mockSubmissionModel = {
      findOne: jest.fn(),
    }

    mockModuleGradeModel = {
      upsert: jest.fn(),
    }

    mockModuleUnlockOverrideModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    }

    moduleService = new ModuleService(
      mockModuleModel,
      mockCourseModel,
      mockContentModel,
      mockAssessmentModel,
      mockSubmissionModel,
      mockModuleGradeModel,
      mockUserModel,
      mockModuleUnlockOverrideModel
    )
  })

  describe('createModule', () => {
    it('should create a module when the course exists and name is valid', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.create.mockResolvedValue({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      })

      const result = await moduleService.createModule(1, 'Module 1', 'Test description')

      expect(result).toEqual({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      })
    })

    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Course not found'
      )
    })

    it('should throw an error when name is missing', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.createModule(1, '', 'Test description')).rejects.toThrow(
        'Module name is required'
      )
    })

    it('should throw an error when name exceeds 255 characters', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      const longName = 'A'.repeat(256)

      await expect(moduleService.createModule(1, longName, 'Test description')).rejects.toThrow(
        'Module name is too long'
      )
    })

    it('should throw a generic error when moduleModel.create fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.create.mockRejectedValue(new Error('Unexpected database error'))

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Failed to create module'
      )
    })

    it('should rethrow SequelizeValidationError', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      const validationError = new Error()
      validationError.name = 'SequelizeValidationError'

      mockModuleModel.create.mockRejectedValue(validationError)

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        validationError
      )
    })
  })

  describe('getModuleById', () => {
    it('should return a module when found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1, name: 'Module 1' })

      const result = await moduleService.getModuleById(1)
      expect(result).toEqual({ id: 1, name: 'Module 1' })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleById(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when findByPk fails', async () => {
      mockModuleModel.findByPk.mockRejectedValue(new Error('Database connection lost'))

      await expect(moduleService.getModuleById(1)).rejects.toThrow('Failed to get module')
    })
  })

  describe('getModulesByCourseId', () => {
    it('should return an array of modules when the course exists', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockResolvedValue([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 },
      ])

      const result = await moduleService.getModulesByCourseId(1)

      expect(result).toEqual([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 },
      ])
    })

    it('should return an empty array when no modules are found', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockResolvedValue([])

      const result = await moduleService.getModulesByCourseId(1)

      expect(result).toEqual([])
    })

    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModulesByCourseId(1)).rejects.toThrow('Course not found')
    })

    it('should throw a generic error when fetching modules fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getModulesByCourseId(1)).rejects.toThrow('Failed to get modules')
    })
  })

  describe('updateModule', () => {
    it('should update a module when found', async () => {
      const mockModule = { save: jest.fn(), name: '', description: '' }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      const result = await moduleService.updateModule(1, 'Updated Module', 'Updated Description')

      expect(mockModule.name).toBe('Updated Module')
      expect(mockModule.description).toBe('Updated Description')
      expect(mockModule.save).toHaveBeenCalled()
      expect(result).toEqual(mockModule)
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow('Module not found')
    })

    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() })

      await expect(moduleService.updateModule(1, '', 'Updated Description')).rejects.toThrow(
        'Module name is required'
      )
    })

    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() })
      const longName = 'A'.repeat(256)

      await expect(moduleService.updateModule(1, longName, 'Updated Description')).rejects.toThrow(
        'Module name is too long'
      )
    })

    it('should throw a generic error when save fails', async () => {
      const mockModule = { save: jest.fn().mockRejectedValue(new Error('Database issue')) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow('Failed to update module')
    })

    it('should rethrow SequelizeValidationError', async () => {
      const validationError = new Error()
      validationError.name = 'SequelizeValidationError'

      const mockModule = { save: jest.fn().mockRejectedValue(validationError) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow(validationError)
    })
  })

  describe('deleteModule', () => {
    it('should delete a module when found', async () => {
      const mockModule = { destroy: jest.fn() }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      const result = await moduleService.deleteModule(1)

      expect(mockModule.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Module deleted successfully' })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.deleteModule(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when destroy fails', async () => {
      const mockModule = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(moduleService.deleteModule(1)).rejects.toThrow('Failed to delete module')
    })
  })

  describe('addModuleContent', () => {
    it('should add content when module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.create.mockResolvedValue({
        id: 1,
        name: 'Content 1',
        link: 'http://example.com',
        module_id: 1,
      })

      const result = await moduleService.addModuleContent(1, 'Content 1', 'http://example.com')

      expect(result).toEqual({ id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.addModuleContent(1, 'Content 1', 'http://example.com')
      ).rejects.toThrow('Module not found')
    })

    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, '', 'http://example.com')).rejects.toThrow(
        'Content name is required'
      )
    })

    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      const longName = 'A'.repeat(256)

      await expect(
        moduleService.addModuleContent(1, longName, 'http://example.com')
      ).rejects.toThrow('Content name is too long')
    })

    it('should throw an error when the link is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, 'Content 1', '')).rejects.toThrow(
        'Content link is required'
      )
    })

    it('should throw an error when the link is invalid', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, 'Content 1', 'invalid-url')).rejects.toThrow(
        'Content link is invalid'
      )
    })

    it('should throw a generic error when create fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.create.mockRejectedValue(new Error('Database error'))

      await expect(
        moduleService.addModuleContent(1, 'Content 1', 'http://example.com')
      ).rejects.toThrow('Failed to add content')
    })
  })

  describe('deleteModuleContent', () => {
    it('should delete content when found', async () => {
      const mockContent = { destroy: jest.fn() }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      const result = await moduleService.deleteModuleContent(1)

      expect(mockContent.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Content deleted successfully' })
    })

    it('should throw an error when the content is not found', async () => {
      mockContentModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.deleteModuleContent(1)).rejects.toThrow('Content not found')
    })

    it('should throw a generic error when destroy fails', async () => {
      const mockContent = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      await expect(moduleService.deleteModuleContent(1)).rejects.toThrow('Failed to delete content')
    })
  })

  describe('getContentsByModuleId', () => {
    it('should return an array of contents when the module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockResolvedValue([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 },
      ])

      const result = await moduleService.getContentsByModuleId(1)

      expect(result).toEqual([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 },
      ])
    })

    it('should return an empty array when no contents are found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockResolvedValue([])

      const result = await moduleService.getContentsByModuleId(1)

      expect(result).toEqual([])
    })

    it('should throw an error when the module does not exist', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getContentsByModuleId(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when fetching contents fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getContentsByModuleId(1)).rejects.toThrow('Failed to get contents')
    })
  })

  describe('updateModuleContent', () => {
    it('should update content when found and valid inputs are provided', async () => {
      const mockContent = {
        save: jest.fn(),
        name: '',
        link: '',
      }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      const result = await moduleService.updateModuleContent(
        1,
        'Updated Content',
        'http://valid-link.com'
      )

      expect(mockContent.name).toBe('Updated Content')
      expect(mockContent.link).toBe('http://valid-link.com')
      expect(mockContent.save).toHaveBeenCalled()
      expect(result).toEqual(mockContent)
    })

    it('should throw an error if the content does not exist', async () => {
      mockContentModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com')
      ).rejects.toThrow('Content not found')
    })

    it('should throw an error if the content name is missing', async () => {
      await expect(
        moduleService.updateModuleContent(1, '', 'http://valid-link.com')
      ).rejects.toThrow('Content name is required')
    })

    it('should throw an error if the content name exceeds 255 characters', async () => {
      const longName = 'a'.repeat(256)

      await expect(
        moduleService.updateModuleContent(1, longName, 'http://valid-link.com')
      ).rejects.toThrow('Content name is too long')
    })

    it('should throw an error if the content link is missing', async () => {
      await expect(moduleService.updateModuleContent(1, 'Valid Content Name', '')).rejects.toThrow(
        'Content link is required'
      )
    })

    it('should throw an error if the content link is invalid', async () => {
      await expect(
        moduleService.updateModuleContent(1, 'Valid Content Name', 'invalid-link')
      ).rejects.toThrow('Content link is invalid')
    })

    it('should throw a generic error when the update fails', async () => {
      const mockContent = { save: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      await expect(
        moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com')
      ).rejects.toThrow('Failed to update content')
    })
  })

  describe('getModuleGradeOfUser', () => {
    it('should throw error when user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow('User not found')
    })

    it('should throw error when module not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow('Module not found')
    })

    it('should return default values when no assessments exist', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([])

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: true,
        averageScore: 100,
      })
    })

    it('should return correct values when some submissions are missing', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne.mockResolvedValueOnce({
        score: 75,
        status: 'graded',
      })

      mockSubmissionModel.findOne.mockResolvedValueOnce(null)

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: false,
        allPassed: false,
        averageScore: 37.5,
        submissions: [
          {
            assessment_id: undefined,
            max_score: undefined,
            passed: true,
            score: 75,
          },
        ],
      })
    })

    it('should return correct values when all submissions exist and passed', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne
        .mockResolvedValueOnce({ score: 85, status: 'graded' })
        .mockResolvedValueOnce({ score: 90, status: 'graded' })

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: true,
        averageScore: 87.5,
        submissions: [
          { assessment_id: undefined, max_score: undefined, passed: true, score: 85 },
          { assessment_id: undefined, max_score: undefined, passed: true, score: 90 },
        ],
      })
    })

    it('should return correct values when all submissions exist but some failed', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne
        .mockResolvedValueOnce({ score: 85, status: 'graded' })
        .mockResolvedValueOnce({ score: 75, status: 'graded' })

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: false,
        averageScore: 80,
        submissions: [
          { assessment_id: undefined, max_score: undefined, passed: true, score: 85 },
          { assessment_id: undefined, max_score: undefined, passed: false, score: 75 },
        ],
      })
    })

    it('should upsert the module grade with the calculated average', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])
      mockSubmissionModel.findOne.mockResolvedValue({ score: 85, status: 'graded' })

      await moduleService.getModuleGradeOfUser(1, 1)

      expect(mockModuleGradeModel.upsert).toHaveBeenCalledWith({
        user_id: 1,
        module_id: 1,
        grade: 85,
      })
    })

    it('should throw generic error when unexpected error occurs', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow(
        'Failed to get module grade'
      )
    })
  })

  describe('unlockNextModuleForLearner', () => {
    // Setup common test objects
    const learnerId = 1
    const currentModuleId = 2
    const teacherId = 3
    const reason = 'Student demonstrated understanding through alternative assessment'

    // Setup a module sequence for testing
    const modulesList = [
      { module_id: 1, name: 'Module 1', course_id: 1 },
      { module_id: 2, name: 'Module 2', course_id: 1 },
      { module_id: 3, name: 'Module 3', course_id: 1 },
    ]

    const courseObject = { id: 1, name: 'Test Course' }

    // Helper function to set up common mocks for successful unlocking
    const setupSuccessfulUnlockMocks = () => {
      // Mock learner user
      mockUserModel.findByPk.mockImplementation((id) => {
        if (id === learnerId) {
          return Promise.resolve({ id: learnerId, role: 'learner' })
        }
        return Promise.resolve({ id })
      })

      // Mock current module with course association
      mockModuleModel.findByPk.mockImplementation((id) => {
        if (id === currentModuleId) {
          return Promise.resolve({
            module_id: currentModuleId,
            name: 'Module 2',
            course_id: 1,
            course: courseObject,
          })
        }
        return Promise.resolve(null)
      })

      // Mock course modules list
      mockModuleModel.findAll.mockResolvedValue(modulesList)

      // By default, no existing override
      mockModuleUnlockOverrideModel.findOne.mockResolvedValue(null)

      // Mock successful override creation
      mockModuleUnlockOverrideModel.create.mockImplementation((data) =>
        Promise.resolve({
          ...data,
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )
    }

    it('should unlock the next module when all conditions are met', async () => {
      setupSuccessfulUnlockMocks()

      const result = await moduleService.unlockNextModuleForLearner(
        learnerId,
        currentModuleId,
        teacherId,
        reason
      )

      expect(result).toMatchObject({
        message: 'Next module unlocked successfully.',
        unlockedModule: modulesList[2], // Should be Module 3, the one after currentModuleId
      })

      expect(mockModuleUnlockOverrideModel.create).toHaveBeenCalledWith({
        user_id: learnerId,
        unlocked_module_id: 3, // Next module ID after currentModuleId
        course_id: 1,
        overridden_by_user_id: teacherId,
        reason: reason,
      })
    })

    it('should return existing override when module is already unlocked', async () => {
      setupSuccessfulUnlockMocks()

      // Mock existing override
      const existingOverride = {
        id: 5,
        user_id: learnerId,
        unlocked_module_id: 3,
        course_id: 1,
        overridden_by_user_id: teacherId,
        reason: 'Previously unlocked',
        createdAt: new Date('2023-01-01'),
      }

      mockModuleUnlockOverrideModel.findOne.mockResolvedValue(existingOverride)

      const result = await moduleService.unlockNextModuleForLearner(
        learnerId,
        currentModuleId,
        teacherId,
        reason
      )

      expect(result).toMatchObject({
        message: 'Next module already manually unlocked.',
        unlockedModule: modulesList[2],
        override: existingOverride,
      })

      expect(mockModuleUnlockOverrideModel.create).not.toHaveBeenCalled()
    })

    it('should throw error when learner is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Learner not found or invalid role.')
    })

    it('should throw error when user is not a learner', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'teacher', // Not a learner
      })

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Learner not found or invalid role.')
    })

    it('should throw error when current module is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'learner',
      })

      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Current module not found.')
    })

    it('should throw error when current module has no associated course', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'learner',
      })

      mockModuleModel.findByPk.mockResolvedValue({
        module_id: currentModuleId,
        name: 'Module 2',
        // No course association
      })

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Course not found for the current module.')
    })

    it('should throw error when current module is not in the course sequence', async () => {
      setupSuccessfulUnlockMocks()

      // Change moduleList to not include the current module
      mockModuleModel.findAll.mockResolvedValue([
        { module_id: 1, name: 'Module 1', course_id: 1 },
        { module_id: 4, name: 'Different Module', course_id: 1 },
      ])

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Current module not found in course module sequence.')
    })

    it('should throw error when current module is the last in sequence', async () => {
      setupSuccessfulUnlockMocks()

      // Make current module the last one in the sequence
      mockModuleModel.findByPk.mockImplementation((id) => {
        if (id === 3) {
          // Using module_id 3 as current
          return Promise.resolve({
            module_id: 3, // Last module in the list
            name: 'Module 3',
            course_id: 1,
            course: courseObject,
          })
        }
        return Promise.resolve(null)
      })

      await expect(
        moduleService.unlockNextModuleForLearner(
          learnerId,
          3, // Using module_id 3 as current
          teacherId,
          reason
        )
      ).rejects.toThrow('Current module is already the last module.')
    })
  })
})
=======
import { beforeEach, describe, expect, jest } from '@jest/globals'
import ModuleService from '../../../src/services/moduleService'

describe('Module Service', () => {
  let moduleService
  let mockModuleModel
  let mockCourseModel
  let mockContentModel
  let mockAssessmentModel
  let mockSubmissionModel
  let mockModuleGradeModel
  let mockUserModel
  let mockModuleUnlockOverrideModel

  beforeEach(() => {
    mockModuleModel = {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }

    mockCourseModel = {
      findByPk: jest.fn(),
    }

    mockContentModel = {
      findByPk: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
    }

    mockUserModel = {
      findByPk: jest.fn(),
    }

    mockAssessmentModel = {
      findAll: jest.fn(),
    }

    mockSubmissionModel = {
      findOne: jest.fn(),
    }

    mockModuleGradeModel = {
      upsert: jest.fn(),
    }

    mockModuleUnlockOverrideModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    }

    moduleService = new ModuleService(
      mockModuleModel,
      mockCourseModel,
      mockContentModel,
      mockAssessmentModel,
      mockSubmissionModel,
      mockModuleGradeModel,
      mockUserModel,
      mockModuleUnlockOverrideModel
    )
  })

  describe('createModule', () => {
    it('should create a module when the course exists and name is valid', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.create.mockResolvedValue({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      })

      const result = await moduleService.createModule(1, 'Module 1', 'Test description')

      expect(result).toEqual({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      })
    })

    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Course not found'
      )
    })

    it('should throw an error when name is missing', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.createModule(1, '', 'Test description')).rejects.toThrow(
        'Module name is required'
      )
    })

    it('should throw an error when name exceeds 255 characters', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      const longName = 'A'.repeat(256)

      await expect(moduleService.createModule(1, longName, 'Test description')).rejects.toThrow(
        'Module name is too long'
      )
    })

    it('should throw a generic error when moduleModel.create fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.create.mockRejectedValue(new Error('Unexpected database error'))

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Failed to create module'
      )
    })

    it('should rethrow SequelizeValidationError', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      const validationError = new Error()
      validationError.name = 'SequelizeValidationError'

      mockModuleModel.create.mockRejectedValue(validationError)

      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        validationError
      )
    })
  })

  describe('getModuleById', () => {
    it('should return a module when found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1, name: 'Module 1' })

      const result = await moduleService.getModuleById(1)
      expect(result).toEqual({ id: 1, name: 'Module 1' })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleById(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when findByPk fails', async () => {
      mockModuleModel.findByPk.mockRejectedValue(new Error('Database connection lost'))

      await expect(moduleService.getModuleById(1)).rejects.toThrow('Failed to get module')
    })
  })

  describe('getModulesByCourseId', () => {
    it('should return an array of modules when the course exists', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockResolvedValue([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 },
      ])

      const result = await moduleService.getModulesByCourseId(1)

      expect(result).toEqual([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 },
      ])
    })

    it('should return an empty array when no modules are found', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockResolvedValue([])

      const result = await moduleService.getModulesByCourseId(1)

      expect(result).toEqual([])
    })

    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModulesByCourseId(1)).rejects.toThrow('Course not found')
    })

    it('should throw a generic error when fetching modules fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getModulesByCourseId(1)).rejects.toThrow('Failed to get modules')
    })
  })

  describe('updateModule', () => {
    it('should update a module when found', async () => {
      const mockModule = { save: jest.fn(), name: '', description: '' }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      const result = await moduleService.updateModule(1, 'Updated Module', 'Updated Description')

      expect(mockModule.name).toBe('Updated Module')
      expect(mockModule.description).toBe('Updated Description')
      expect(mockModule.save).toHaveBeenCalled()
      expect(result).toEqual(mockModule)
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow('Module not found')
    })

    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() })

      await expect(moduleService.updateModule(1, '', 'Updated Description')).rejects.toThrow(
        'Module name is required'
      )
    })

    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() })
      const longName = 'A'.repeat(256)

      await expect(moduleService.updateModule(1, longName, 'Updated Description')).rejects.toThrow(
        'Module name is too long'
      )
    })

    it('should throw a generic error when save fails', async () => {
      const mockModule = { save: jest.fn().mockRejectedValue(new Error('Database issue')) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow('Failed to update module')
    })

    it('should rethrow SequelizeValidationError', async () => {
      const validationError = new Error()
      validationError.name = 'SequelizeValidationError'

      const mockModule = { save: jest.fn().mockRejectedValue(validationError) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(
        moduleService.updateModule(1, 'Updated Module', 'Updated Description')
      ).rejects.toThrow(validationError)
    })
  })

  describe('deleteModule', () => {
    it('should delete a module when found', async () => {
      const mockModule = { destroy: jest.fn() }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      const result = await moduleService.deleteModule(1)

      expect(mockModule.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Module deleted successfully' })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.deleteModule(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when destroy fails', async () => {
      const mockModule = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockModuleModel.findByPk.mockResolvedValue(mockModule)

      await expect(moduleService.deleteModule(1)).rejects.toThrow('Failed to delete module')
    })
  })

  describe('addModuleContent', () => {
    it('should add content when module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.create.mockResolvedValue({
        id: 1,
        name: 'Content 1',
        link: 'http://example.com',
        module_id: 1,
      })

      const result = await moduleService.addModuleContent(1, 'Content 1', 'http://example.com')

      expect(result).toEqual({ id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 })
    })

    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.addModuleContent(1, 'Content 1', 'http://example.com')
      ).rejects.toThrow('Module not found')
    })

    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, '', 'http://example.com')).rejects.toThrow(
        'Content name is required'
      )
    })

    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      const longName = 'A'.repeat(256)

      await expect(
        moduleService.addModuleContent(1, longName, 'http://example.com')
      ).rejects.toThrow('Content name is too long')
    })

    it('should throw an error when the link is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, 'Content 1', '')).rejects.toThrow(
        'Content link is required'
      )
    })

    it('should throw an error when the link is invalid', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })

      await expect(moduleService.addModuleContent(1, 'Content 1', 'invalid-url')).rejects.toThrow(
        'Content link is invalid'
      )
    })

    it('should throw a generic error when create fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.create.mockRejectedValue(new Error('Database error'))

      await expect(
        moduleService.addModuleContent(1, 'Content 1', 'http://example.com')
      ).rejects.toThrow('Failed to add content')
    })
  })

  describe('deleteModuleContent', () => {
    it('should delete content when found', async () => {
      const mockContent = { destroy: jest.fn() }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      const result = await moduleService.deleteModuleContent(1)

      expect(mockContent.destroy).toHaveBeenCalled()
      expect(result).toEqual({ message: 'Content deleted successfully' })
    })

    it('should throw an error when the content is not found', async () => {
      mockContentModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.deleteModuleContent(1)).rejects.toThrow('Content not found')
    })

    it('should throw a generic error when destroy fails', async () => {
      const mockContent = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      await expect(moduleService.deleteModuleContent(1)).rejects.toThrow('Failed to delete content')
    })
  })

  describe('getContentsByModuleId', () => {
    it('should return an array of contents when the module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockResolvedValue([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 },
      ])

      const result = await moduleService.getContentsByModuleId(1)

      expect(result).toEqual([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 },
      ])
    })

    it('should return an empty array when no contents are found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockResolvedValue([])

      const result = await moduleService.getContentsByModuleId(1)

      expect(result).toEqual([])
    })

    it('should throw an error when the module does not exist', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getContentsByModuleId(1)).rejects.toThrow('Module not found')
    })

    it('should throw a generic error when fetching contents fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockContentModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getContentsByModuleId(1)).rejects.toThrow('Failed to get contents')
    })
  })

  describe('updateModuleContent', () => {
    it('should update content when found and valid inputs are provided', async () => {
      const mockContent = {
        save: jest.fn(),
        name: '',
        link: '',
      }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      const result = await moduleService.updateModuleContent(
        1,
        'Updated Content',
        'http://valid-link.com'
      )

      expect(mockContent.name).toBe('Updated Content')
      expect(mockContent.link).toBe('http://valid-link.com')
      expect(mockContent.save).toHaveBeenCalled()
      expect(result).toEqual(mockContent)
    })

    it('should throw an error if the content does not exist', async () => {
      mockContentModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com')
      ).rejects.toThrow('Content not found')
    })

    it('should throw an error if the content name is missing', async () => {
      await expect(
        moduleService.updateModuleContent(1, '', 'http://valid-link.com')
      ).rejects.toThrow('Content name is required')
    })

    it('should throw an error if the content name exceeds 255 characters', async () => {
      const longName = 'a'.repeat(256)

      await expect(
        moduleService.updateModuleContent(1, longName, 'http://valid-link.com')
      ).rejects.toThrow('Content name is too long')
    })

    it('should throw an error if the content link is missing', async () => {
      await expect(moduleService.updateModuleContent(1, 'Valid Content Name', '')).rejects.toThrow(
        'Content link is required'
      )
    })

    it('should throw an error if the content link is invalid', async () => {
      await expect(
        moduleService.updateModuleContent(1, 'Valid Content Name', 'invalid-link')
      ).rejects.toThrow('Content link is invalid')
    })

    it('should throw a generic error when the update fails', async () => {
      const mockContent = { save: jest.fn().mockRejectedValue(new Error('Database error')) }
      mockContentModel.findByPk.mockResolvedValue(mockContent)

      await expect(
        moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com')
      ).rejects.toThrow('Failed to update content')
    })
  })

  describe('getModuleGradeOfUser', () => {
    it('should throw error when user not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow('User not found')
    })

    it('should throw error when module not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow('Module not found')
    })

    it('should return default values when no assessments exist', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([])

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: true,
        averageScore: 100,
      })
    })

    it('should return correct values when some submissions are missing', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne.mockResolvedValueOnce({
        score: 75,
        status: 'graded',
      })

      mockSubmissionModel.findOne.mockResolvedValueOnce(null)

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: false,
        allPassed: false,
        averageScore: 37.5,
        submissions: [
          {
            assessment_id: undefined,
            max_score: undefined,
            passed: true,
            score: 75,
          },
        ],
      })
    })

    it('should return correct values when all submissions exist and passed', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne
        .mockResolvedValueOnce({ score: 85, status: 'graded' })
        .mockResolvedValueOnce({ score: 90, status: 'graded' })

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: true,
        averageScore: 87.5,
        submissions: [
          { assessment_id: undefined, max_score: undefined, passed: true, score: 85 },
          { assessment_id: undefined, max_score: undefined, passed: true, score: 90 },
        ],
      })
    })

    it('should return correct values when all submissions exist but some failed', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])

      mockSubmissionModel.findOne
        .mockResolvedValueOnce({ score: 85, status: 'graded' })
        .mockResolvedValueOnce({ score: 75, status: 'graded' })

      const result = await moduleService.getModuleGradeOfUser(1, 1)

      expect(result).toEqual({
        allGraded: true,
        allPassed: false,
        averageScore: 80,
        submissions: [
          { assessment_id: undefined, max_score: undefined, passed: true, score: 85 },
          { assessment_id: undefined, max_score: undefined, passed: false, score: 75 },
        ],
      })
    })

    it('should upsert the module grade with the calculated average', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockResolvedValue([
        {
          id: 1,
          passing_score: 70,
          max_score: 100,
        },
        {
          id: 2,
          passing_score: 80,
          max_score: 100,
        },
      ])
      mockSubmissionModel.findOne.mockResolvedValue({ score: 85, status: 'graded' })

      await moduleService.getModuleGradeOfUser(1, 1)

      expect(mockModuleGradeModel.upsert).toHaveBeenCalledWith({
        user_id: 1,
        module_id: 1,
        grade: 85,
      })
    })

    it('should throw generic error when unexpected error occurs', async () => {
      mockUserModel.findByPk.mockResolvedValue({ id: 1 })
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 })
      mockAssessmentModel.findAll.mockRejectedValue(new Error('Database error'))

      await expect(moduleService.getModuleGradeOfUser(1, 1)).rejects.toThrow(
        'Failed to get module grade'
      )
    })
  })

  describe('unlockNextModuleForLearner', () => {
    // Setup common test objects
    const learnerId = 1
    const currentModuleId = 2
    const teacherId = 3
    const reason = 'Student demonstrated understanding through alternative assessment'

    // Setup a module sequence for testing
    const modulesList = [
      { module_id: 1, name: 'Module 1', course_id: 1 },
      { module_id: 2, name: 'Module 2', course_id: 1 },
      { module_id: 3, name: 'Module 3', course_id: 1 },
    ]

    const courseObject = { id: 1, name: 'Test Course' }

    // Helper function to set up common mocks for successful unlocking
    const setupSuccessfulUnlockMocks = () => {
      // Mock learner user
      mockUserModel.findByPk.mockImplementation((id) => {
        if (id === learnerId) {
          return Promise.resolve({ id: learnerId, role: 'learner' })
        }
        return Promise.resolve({ id })
      })

      // Mock current module with course association
      mockModuleModel.findByPk.mockImplementation((id) => {
        if (id === currentModuleId) {
          return Promise.resolve({
            module_id: currentModuleId,
            name: 'Module 2',
            course_id: 1,
            course: courseObject,
          })
        }
        return Promise.resolve(null)
      })

      // Mock course modules list
      mockModuleModel.findAll.mockResolvedValue(modulesList)

      // By default, no existing override
      mockModuleUnlockOverrideModel.findOne.mockResolvedValue(null)

      // Mock successful override creation
      mockModuleUnlockOverrideModel.create.mockImplementation((data) =>
        Promise.resolve({
          ...data,
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )
    }

    it('should unlock the next module when all conditions are met', async () => {
      setupSuccessfulUnlockMocks()

      const result = await moduleService.unlockNextModuleForLearner(
        learnerId,
        currentModuleId,
        teacherId,
        reason
      )

      expect(result).toMatchObject({
        message: 'Next module unlocked successfully.',
        unlockedModule: modulesList[2], // Should be Module 3, the one after currentModuleId
      })

      expect(mockModuleUnlockOverrideModel.create).toHaveBeenCalledWith({
        user_id: learnerId,
        unlocked_module_id: 3, // Next module ID after currentModuleId
        course_id: 1,
        overridden_by_user_id: teacherId,
        reason: reason,
      })
    })

    it('should return existing override when module is already unlocked', async () => {
      setupSuccessfulUnlockMocks()

      // Mock existing override
      const existingOverride = {
        id: 5,
        user_id: learnerId,
        unlocked_module_id: 3,
        course_id: 1,
        overridden_by_user_id: teacherId,
        reason: 'Previously unlocked',
        createdAt: new Date('2023-01-01'),
      }

      mockModuleUnlockOverrideModel.findOne.mockResolvedValue(existingOverride)

      const result = await moduleService.unlockNextModuleForLearner(
        learnerId,
        currentModuleId,
        teacherId,
        reason
      )

      expect(result).toMatchObject({
        message: 'Next module already manually unlocked.',
        unlockedModule: modulesList[2],
        override: existingOverride,
      })

      expect(mockModuleUnlockOverrideModel.create).not.toHaveBeenCalled()
    })

    it('should throw error when learner is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Learner not found or invalid role.')
    })

    it('should throw error when user is not a learner', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'teacher', // Not a learner
      })

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Learner not found or invalid role.')
    })

    it('should throw error when current module is not found', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'learner',
      })

      mockModuleModel.findByPk.mockResolvedValue(null)

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Current module not found.')
    })

    it('should throw error when current module has no associated course', async () => {
      mockUserModel.findByPk.mockResolvedValue({
        id: learnerId,
        role: 'learner',
      })

      mockModuleModel.findByPk.mockResolvedValue({
        module_id: currentModuleId,
        name: 'Module 2',
        // No course association
      })

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Course not found for the current module.')
    })

    it('should throw error when current module is not in the course sequence', async () => {
      setupSuccessfulUnlockMocks()

      // Change moduleList to not include the current module
      mockModuleModel.findAll.mockResolvedValue([
        { module_id: 1, name: 'Module 1', course_id: 1 },
        { module_id: 4, name: 'Different Module', course_id: 1 },
      ])

      await expect(
        moduleService.unlockNextModuleForLearner(learnerId, currentModuleId, teacherId, reason)
      ).rejects.toThrow('Current module not found in course module sequence.')
    })

    it('should throw error when current module is the last in sequence', async () => {
      setupSuccessfulUnlockMocks()

      // Make current module the last one in the sequence
      mockModuleModel.findByPk.mockImplementation((id) => {
        if (id === 3) {
          // Using module_id 3 as current
          return Promise.resolve({
            module_id: 3, // Last module in the list
            name: 'Module 3',
            course_id: 1,
            course: courseObject,
          })
        }
        return Promise.resolve(null)
      })

      await expect(
        moduleService.unlockNextModuleForLearner(
          learnerId,
          3, // Using module_id 3 as current
          teacherId,
          reason
        )
      ).rejects.toThrow('Current module is already the last module.')
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

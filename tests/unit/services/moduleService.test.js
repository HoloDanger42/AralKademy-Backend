import { beforeEach, describe, expect, jest } from '@jest/globals';
import ModuleService from '../../../src/services/moduleService';

describe('Module Service', () => {
  let moduleService;
  let mockModuleModel;
  let mockCourseModel;
  let mockContentModel;

  beforeEach(() => {
    mockModuleModel = {
      create: jest.fn(),
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    };

    mockCourseModel = {
      findByPk: jest.fn(),
    };

    mockContentModel = {
      findByPk: jest.fn(),
      create: jest.fn(), 
      findAll: jest.fn(),
    };
    moduleService = new ModuleService(mockModuleModel, mockCourseModel, mockContentModel);
  });

  describe('createModule', () => {
    it('should create a module when the course exists and name is valid', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      mockModuleModel.create.mockResolvedValue({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      });
  
      const result = await moduleService.createModule(1, 'Module 1', 'Test description');
  
      expect(result).toEqual({
        id: 1,
        name: 'Module 1',
        description: 'Test description',
        course_id: 1,
      });
    });
  
    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Course not found'
      );
    });
  
    it('should throw an error when name is missing', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
  
      await expect(moduleService.createModule(1, '', 'Test description')).rejects.toThrow(
        'Module name is required'
      );
    });
  
    it('should throw an error when name exceeds 255 characters', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      const longName = 'A'.repeat(256);
  
      await expect(moduleService.createModule(1, longName, 'Test description')).rejects.toThrow(
        'Module name is too long'
      );
    });
  
    it('should throw a generic error when moduleModel.create fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      mockModuleModel.create.mockRejectedValue(new Error('Unexpected database error'));
  
      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        'Failed to create module'
      );
    });
  
    it('should rethrow SequelizeValidationError', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      const validationError = new Error();
      validationError.name = 'SequelizeValidationError';
  
      mockModuleModel.create.mockRejectedValue(validationError);
  
      await expect(moduleService.createModule(1, 'Module 1', 'Test description')).rejects.toThrow(
        validationError
      );
    });
  });
  

  describe('getModuleById', () => {
    it('should return a module when found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1, name: 'Module 1' });
  
      const result = await moduleService.getModuleById(1);
      expect(result).toEqual({ id: 1, name: 'Module 1' });
    });
  
    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.getModuleById(1)).rejects.toThrow('Module not found');
    });
  
    it('should throw a generic error when findByPk fails', async () => {
      mockModuleModel.findByPk.mockRejectedValue(new Error('Database connection lost'));
  
      await expect(moduleService.getModuleById(1)).rejects.toThrow('Failed to get module');
    });
  });
  
  describe('getModulesByCourseId', () => {
    it('should return an array of modules when the course exists', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      mockModuleModel.findAll.mockResolvedValue([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 }
      ]);
  
      const result = await moduleService.getModulesByCourseId(1);
  
      expect(result).toEqual([
        { id: 1, name: 'Module 1', description: 'Desc 1', course_id: 1 },
        { id: 2, name: 'Module 2', description: 'Desc 2', course_id: 1 }
      ]);
    });
  
    it('should return an empty array when no modules are found', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      mockModuleModel.findAll.mockResolvedValue([]);
  
      const result = await moduleService.getModulesByCourseId(1);
  
      expect(result).toEqual([]);
    });
  
    it('should throw an error when the course does not exist', async () => {
      mockCourseModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.getModulesByCourseId(1))
        .rejects.toThrow('Course not found');
    });
  
    it('should throw a generic error when fetching modules fails', async () => {
      mockCourseModel.findByPk.mockResolvedValue({ id: 1 });
      mockModuleModel.findAll.mockRejectedValue(new Error('Database error'));
  
      await expect(moduleService.getModulesByCourseId(1))
        .rejects.toThrow('Failed to get modules');
    });
  });  

  describe('updateModule', () => {
    it('should update a module when found', async () => {
      const mockModule = { save: jest.fn(), name: '', description: '' };
      mockModuleModel.findByPk.mockResolvedValue(mockModule);
  
      const result = await moduleService.updateModule(1, 'Updated Module', 'Updated Description');
  
      expect(mockModule.name).toBe('Updated Module');
      expect(mockModule.description).toBe('Updated Description');
      expect(mockModule.save).toHaveBeenCalled();
      expect(result).toEqual(mockModule);
    });
  
    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.updateModule(1, 'Updated Module', 'Updated Description'))
        .rejects.toThrow('Module not found');
    });
  
    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() });
  
      await expect(moduleService.updateModule(1, '', 'Updated Description'))
        .rejects.toThrow('Module name is required');
    });
  
    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ save: jest.fn() });
      const longName = 'A'.repeat(256);
  
      await expect(moduleService.updateModule(1, longName, 'Updated Description'))
        .rejects.toThrow('Module name is too long');
    });
  
    it('should throw a generic error when save fails', async () => {
      const mockModule = { save: jest.fn().mockRejectedValue(new Error('Database issue')) };
      mockModuleModel.findByPk.mockResolvedValue(mockModule);
  
      await expect(moduleService.updateModule(1, 'Updated Module', 'Updated Description'))
        .rejects.toThrow('Failed to update module');
    });
  
    it('should rethrow SequelizeValidationError', async () => {
      const validationError = new Error();
      validationError.name = 'SequelizeValidationError';
  
      const mockModule = { save: jest.fn().mockRejectedValue(validationError) };
      mockModuleModel.findByPk.mockResolvedValue(mockModule);
  
      await expect(moduleService.updateModule(1, 'Updated Module', 'Updated Description'))
        .rejects.toThrow(validationError);
    });
  });
  

  describe('deleteModule', () => {
    it('should delete a module when found', async () => {
      const mockModule = { destroy: jest.fn() };
      mockModuleModel.findByPk.mockResolvedValue(mockModule);
  
      const result = await moduleService.deleteModule(1);
  
      expect(mockModule.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Module deleted successfully' });
    });
  
    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.deleteModule(1)).rejects.toThrow('Module not found');
    });
  
    it('should throw a generic error when destroy fails', async () => {
      const mockModule = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) };
      mockModuleModel.findByPk.mockResolvedValue(mockModule);
  
      await expect(moduleService.deleteModule(1)).rejects.toThrow('Failed to delete module');
    });
  });
  

  describe('addModuleContent', () => {
    it('should add content when module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      mockContentModel.create.mockResolvedValue({ id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 });
  
      const result = await moduleService.addModuleContent(1, 'Content 1', 'http://example.com');
  
      expect(result).toEqual({ id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 });
    });
  
    it('should throw an error when the module is not found', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.addModuleContent(1, 'Content 1', 'http://example.com'))
        .rejects.toThrow('Module not found');
    });
  
    it('should throw an error when the name is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
  
      await expect(moduleService.addModuleContent(1, '', 'http://example.com'))
        .rejects.toThrow('Content name is required');
    });
  
    it('should throw an error when the name exceeds 255 characters', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      const longName = 'A'.repeat(256);
  
      await expect(moduleService.addModuleContent(1, longName, 'http://example.com'))
        .rejects.toThrow('Content name is too long');
    });
  
    it('should throw an error when the link is missing', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
  
      await expect(moduleService.addModuleContent(1, 'Content 1', ''))
        .rejects.toThrow('Content link is required');
    });
  
    it('should throw an error when the link is invalid', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
  
      await expect(moduleService.addModuleContent(1, 'Content 1', 'invalid-url'))
        .rejects.toThrow('Content link is invalid');
    });
  
    it('should throw a generic error when create fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      mockContentModel.create.mockRejectedValue(new Error('Database error'));
  
      await expect(moduleService.addModuleContent(1, 'Content 1', 'http://example.com'))
        .rejects.toThrow('Failed to add content');
    });
  });
  
  describe('deleteModuleContent', () => {
    it('should delete content when found', async () => {
      const mockContent = { destroy: jest.fn() };
      mockContentModel.findByPk.mockResolvedValue(mockContent);
  
      const result = await moduleService.deleteModuleContent(1);
  
      expect(mockContent.destroy).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Content deleted successfully' });
    });
  
    it('should throw an error when the content is not found', async () => {
      mockContentModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.deleteModuleContent(1))
        .rejects.toThrow('Content not found');
    });
  
    it('should throw a generic error when destroy fails', async () => {
      const mockContent = { destroy: jest.fn().mockRejectedValue(new Error('Database error')) };
      mockContentModel.findByPk.mockResolvedValue(mockContent);
  
      await expect(moduleService.deleteModuleContent(1))
        .rejects.toThrow('Failed to delete content');
    });
  });  

  describe('getContentsByModuleId', () => {
    it('should return an array of contents when the module exists', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      mockContentModel.findAll.mockResolvedValue([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 }
      ]);
  
      const result = await moduleService.getContentsByModuleId(1);
  
      expect(result).toEqual([
        { id: 1, name: 'Content 1', link: 'http://example.com', module_id: 1 },
        { id: 2, name: 'Content 2', link: 'http://example2.com', module_id: 1 }
      ]);
    });
  
    it('should return an empty array when no contents are found', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      mockContentModel.findAll.mockResolvedValue([]);
  
      const result = await moduleService.getContentsByModuleId(1);
  
      expect(result).toEqual([]);
    });
  
    it('should throw an error when the module does not exist', async () => {
      mockModuleModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.getContentsByModuleId(1))
        .rejects.toThrow('Module not found');
    });
  
    it('should throw a generic error when fetching contents fails', async () => {
      mockModuleModel.findByPk.mockResolvedValue({ id: 1 });
      mockContentModel.findAll.mockRejectedValue(new Error('Database error'));
  
      await expect(moduleService.getContentsByModuleId(1))
        .rejects.toThrow('Failed to get contents');
    });
  });  

  describe('updateModuleContent', () => {
    it('should update content when found and valid inputs are provided', async () => {
      const mockContent = { 
        save: jest.fn(), 
        name: '', 
        link: '' 
      };
      mockContentModel.findByPk.mockResolvedValue(mockContent);
  
      const result = await moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com');
  
      expect(mockContent.name).toBe('Updated Content');
      expect(mockContent.link).toBe('http://valid-link.com');
      expect(mockContent.save).toHaveBeenCalled();
      expect(result).toEqual(mockContent);
    });
  
    it('should throw an error if the content does not exist', async () => {
      mockContentModel.findByPk.mockResolvedValue(null);
  
      await expect(moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com'))
        .rejects.toThrow('Content not found');
    });
  
    it('should throw an error if the content name is missing', async () => {
      await expect(moduleService.updateModuleContent(1, '', 'http://valid-link.com'))
        .rejects.toThrow('Content name is required');
    });
  
    it('should throw an error if the content name exceeds 255 characters', async () => {
      const longName = 'a'.repeat(256);
      
      await expect(moduleService.updateModuleContent(1, longName, 'http://valid-link.com'))
        .rejects.toThrow('Content name is too long');
    });
  
    it('should throw an error if the content link is missing', async () => {
      await expect(moduleService.updateModuleContent(1, 'Valid Content Name', ''))
        .rejects.toThrow('Content link is required');
    });
  
    it('should throw an error if the content link is invalid', async () => {
      await expect(moduleService.updateModuleContent(1, 'Valid Content Name', 'invalid-link'))
        .rejects.toThrow('Content link is invalid');
    });
  
    it('should throw a generic error when the update fails', async () => {
      const mockContent = { save: jest.fn().mockRejectedValue(new Error('Database error')) };
      mockContentModel.findByPk.mockResolvedValue(mockContent);
  
      await expect(moduleService.updateModuleContent(1, 'Updated Content', 'http://valid-link.com'))
        .rejects.toThrow('Failed to update content');
    });
  });  
});

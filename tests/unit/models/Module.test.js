<<<<<<< HEAD
import { sequelize } from '../../../src/config/database.js';
import { Module } from '../../../src/models/Module.js';
import { createTestCourse } from '../../helpers/testData.js';
import '../../../src/models/associate.js';

describe('Module Model', () => {
  let course;

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    course = await createTestCourse();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Creation', () => {
    it('should create a valid module', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
        description: 'Test Description',
      });

      expect(module).toHaveProperty('module_id');
      expect(module.name).toBe('Test Module');
    });

    it('should fail without required fields', async () => {
      await expect(Module.create({})).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate name length', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: 'a'.repeat(256),
        })
      ).rejects.toThrow('Module name must be between 1 and 255 characters');
    });

    it('should validate description length', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: 'Test Module',
          description: 'a'.repeat(1001),
        })
      ).rejects.toThrow('Module description must be less than 1000 characters');
    });

    it('should fail with empty module name', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: '',
        })
      ).rejects.toThrow('Module name is required');
    });
  });

  describe('Associations', () => {
    it('should associate with course', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
      });

      const found = await Module.findOne({
        where: { module_id: module.module_id },
        include: ['course'],
      });

      expect(found.Course).not.toBeNull();
      expect(found.course_id).toBe(course.id);
    });
  });

  describe('Soft Deletion', () => {
    it('should soft delete module', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
      });

      await module.destroy();

      const found = await Module.findOne({
        where: { module_id: module.module_id },
        paranoid: false,
      });
      expect(found.deletedAt).toBeTruthy();
    });
  });

  describe('Updates', () => {
    it('should update module details', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Old Name',
      });

      await module.update({ name: 'New Name' });

      const updated = await Module.findByPk(module.module_id);
      expect(updated.name).toBe('New Name');
    });
  });

  describe('Query Operations', () => {
    it('should find modules with pagination', async () => {
      const modulesData = Array.from({ length: 5 }, (_, i) => ({
        course_id: course.id,
        name: `Module ${i}`,
      }));

      await Promise.all(modulesData.map((data) => Module.create(data)));

      const { count, rows } = await Module.findAndCountAll({
        limit: 2,
        offset: 0,
      });

      expect(count).toBe(5);
      expect(rows.length).toBe(2);
    });
  });
=======
import { sequelize } from '../../../src/config/database.js';
import { Module } from '../../../src/models/Module.js';
import { createTestCourse } from '../../helpers/testData.js';
import '../../../src/models/associate.js';

describe('Module Model', () => {
  let course;

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    course = await createTestCourse();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Creation', () => {
    it('should create a valid module', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
        description: 'Test Description',
      });

      expect(module).toHaveProperty('module_id');
      expect(module.name).toBe('Test Module');
    });

    it('should fail without required fields', async () => {
      await expect(Module.create({})).rejects.toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate name length', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: 'a'.repeat(256),
        })
      ).rejects.toThrow('Module name must be between 1 and 255 characters');
    });

    it('should validate description length', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: 'Test Module',
          description: 'a'.repeat(1001),
        })
      ).rejects.toThrow('Module description must be less than 1000 characters');
    });

    it('should fail with empty module name', async () => {
      await expect(
        Module.create({
          course_id: course.id,
          name: '',
        })
      ).rejects.toThrow('Module name is required');
    });
  });

  describe('Associations', () => {
    it('should associate with course', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
      });

      const found = await Module.findOne({
        where: { module_id: module.module_id },
        include: ['course'],
      });

      expect(found.Course).not.toBeNull();
      expect(found.course_id).toBe(course.id);
    });
  });

  describe('Soft Deletion', () => {
    it('should soft delete module', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Test Module',
      });

      await module.destroy();

      const found = await Module.findOne({
        where: { module_id: module.module_id },
        paranoid: false,
      });
      expect(found.deletedAt).toBeTruthy();
    });
  });

  describe('Updates', () => {
    it('should update module details', async () => {
      const module = await Module.create({
        course_id: course.id,
        name: 'Old Name',
      });

      await module.update({ name: 'New Name' });

      const updated = await Module.findByPk(module.module_id);
      expect(updated.name).toBe('New Name');
    });
  });

  describe('Query Operations', () => {
    it('should find modules with pagination', async () => {
      const modulesData = Array.from({ length: 5 }, (_, i) => ({
        course_id: course.id,
        name: `Module ${i}`,
      }));

      await Promise.all(modulesData.map((data) => Module.create(data)));

      const { count, rows } = await Module.findAndCountAll({
        limit: 2,
        offset: 0,
      });

      expect(count).toBe(5);
      expect(rows.length).toBe(2);
    });
  });
>>>>>>> 627466f638de697919d077ca56524377d406840d
});
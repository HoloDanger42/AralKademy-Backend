import { sequelize } from '../../../src/config/database.js'
import { School } from '../../../src/models/School.js'
import { User } from '../../../src/models/User.js'
import { createTestSchool } from '../../helpers/testData.js'
import models from '../../../src/models/associate.js'

describe('School Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid school', async () => {
      const school = await School.create({
        name: 'Test School',
        address: 'Test Address',
        contact_no: '02-8123-4567',
      })

      expect(school).toHaveProperty('school_id')
      expect(school.name).toBe('Test School')
    })

    it('should fail without required fields', async () => {
      await expect(School.create({})).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should validate name is required', async () => {
      await expect(
        School.create({
          address: 'Test Address',
          contact_no: '02-8123-4567',
        })
      ).rejects.toThrow('School name is required')
    })

    it('should validate address is required', async () => {
      await expect(
        School.create({
          name: 'Test School',
          contact_no: '02-8123-4567',
        })
      ).rejects.toThrow('Address is required')
    })

    it('should validate contact number format', async () => {
      await expect(
        School.create({
          name: 'Test School',
          address: 'Test Address',
          contact_no: 'invalid',
        })
      ).rejects.toThrow('Contact number must be valid')
    })

    it('should accept valid contact number formats', async () => {
      const validFormats = ['02-8123-4567', '+632-8123-4567', '0323-123-4567']

      for (const contact_no of validFormats) {
        const school = await School.create({
          name: `Test School ${contact_no}`,
          address: 'Test Address',
          contact_no,
        })
        expect(school.contact_no).toBe(contact_no)
      }
    })

    it('should validate name length', async () => {
      await expect(
        School.create({
          name: 'a'.repeat(256),
          address: 'Test Address',
          contact_no: '02-8123-4567',
        })
      ).rejects.toThrow('School name must be between 1 and 255 characters')
    })

    it('should not allow empty contact number', async () => {
      await expect(
        School.create({
          name: 'Test School',
          address: 'Test Address',
          contact_no: '',
        })
      ).rejects.toThrow('Contact number is required')
    })
  })

  describe('Associations', () => {
    it('should have many users', async () => {
      const school = await createTestSchool()
      const user = await User.create({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        password: 'password123',
        school_id: school.school_id,
      })

      const found = await School.findOne({
        where: { school_id: school.school_id },
        include: [{ model: User }],
      })

      expect(found.Users).toBeTruthy()
      expect(found.Users[0].id).toBe(user.id)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique school name', async () => {
      await School.create({
        name: 'Test School',
        address: 'Test Address',
        contact_no: '02-8123-4567',
      })

      await expect(
        School.create({
          name: 'Test School',
          address: 'Different Address',
          contact_no: '02-8123-4567',
        })
      ).rejects.toThrow('School name must be unique')
    })
  })

  describe('Soft Deletion', () => {
    it('should soft delete school', async () => {
      const school = await School.create({
        name: 'Test School',
        address: 'Test Address',
        contact_no: '02-8123-4567',
      })

      await school.destroy()

      const found = await School.findOne({
        where: { school_id: school.school_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })
  })

  describe('Updates', () => {
    it('should update school details', async () => {
      const school = await School.create({
        name: 'Old Name',
        address: 'Old Address',
        contact_no: '02-8123-4567',
      })

      await school.update({
        name: 'New Name',
        address: 'New Address',
      })

      const updated = await School.findByPk(school.school_id)
      expect(updated.name).toBe('New Name')
      expect(updated.address).toBe('New Address')
    })
  })

  describe('Cascade Behavior', () => {
    it('should not delete school with active users', async () => {
      const school = await createTestSchool()
      await User.create({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'admin',
        password: 'password123',
        school_id: school.school_id,
      })

      await expect(school.destroy()).rejects.toThrow()
    })
  })

  describe('Query Operations', () => {
    it('should find schools with pagination', async () => {
      // Create multiple schools
      for (let i = 0; i < 5; i++) {
        await School.create({
          name: `School ${i}`,
          address: `Address ${i}`,
          contact_no: '02-8123-4567',
        })
      }

      const { count, rows } = await School.findAndCountAll({
        limit: 2,
        offset: 0,
      })

      expect(count).toBe(5)
      expect(rows.length).toBe(2)
    })

    it('should search schools by name', async () => {
      await School.create({
        name: 'Target School',
        address: 'Test Address',
        contact_no: '02-8123-4567',
      })

      const found = await School.findOne({
        where: {
          name: 'Target School',
        },
      })
      expect(found).toBeTruthy()
      expect(found.name).toBe('Target School')
    })
  })
})

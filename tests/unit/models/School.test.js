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
})

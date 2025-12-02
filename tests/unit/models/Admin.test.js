<<<<<<< HEAD
import { sequelize } from '../../../src/config/database.js'
import { Admin } from '../../../src/models/Admin.js'
import { User } from '../../../src/models/User.js'
import { Enrollment } from '../../../src/models/Enrollment.js'
import { createTestUser, createTestSchool } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('Admin Model', () => {
  let user
  let school

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    user = await createTestUser({
      role: 'admin',
      school_id: school.school_id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid admin', async () => {
      const admin = await Admin.create({
        user_id: user.id,
      })
      expect(admin).toHaveProperty('user_id')
      expect(admin.user_id).toBe(user.id)
    })

    it('should fail without user_id', async () => {
      await expect(Admin.create({})).rejects.toThrow('user_id cannot be null')
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const found = await Admin.findOne({
        where: { user_id: admin.user_id },
        include: [{ model: User, as: 'user' }],
      })
      expect(found.user.id).toBe(user.id)
    })

    it('should have many enrollments', async () => {
      try {
        const admin = await Admin.create({
          user_id: user.id,
        })
        const enrollment = await Enrollment.create({
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'Student',
          birth_date: new Date('2000-01-01'),
          contact_no: '09123456789',
          year_level: 3,
          status: 'pending',
          handled_by_id: admin.user_id,
          school_id: school.school_id,
          enrollment_date: new Date(),
          password: 'securepassword123',
        })

        const found = await Admin.findOne({
          where: { user_id: admin.user_id },
          include: [{ model: Enrollment, as: 'enrollments' }],
        })
        expect(found.enrollments[0].id).toBe(enrollment.id)
      } catch (error) {
        console.error(error)
        throw error
      }
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      await Admin.create({ user_id: user.id })
      await expect(Admin.create({ user_id: user.id })).rejects.toThrow()
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete admin', async () => {
      const admin = await Admin.create({ user_id: user.id })
      await admin.destroy()
      const found = await Admin.findOne({
        where: { user_id: admin.user_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })

    it('should cascade delete when user is deleted', async () => {
      await Admin.create({ user_id: user.id })
      await user.destroy({ force: true })
      const adminCount = await Admin.count()
      expect(adminCount).toBe(0)
    })
  })

  describe('Attributes', () => {
    it('should have all required attributes', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const attributes = ['user_id', 'createdAt', 'updatedAt', 'deletedAt']
      attributes.forEach((attr) => {
        expect(admin).toHaveProperty(attr)
      })
    })
  })

  describe('Query Operations', () => {
    it('should find active admins', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const found = await Admin.findAll({ where: { deletedAt: null } })
      expect(found).toHaveLength(1)
    })
  })
})
=======
import { sequelize } from '../../../src/config/database.js'
import { Admin } from '../../../src/models/Admin.js'
import { User } from '../../../src/models/User.js'
import { Enrollment } from '../../../src/models/Enrollment.js'
import { createTestUser, createTestSchool } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('Admin Model', () => {
  let user
  let school

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    user = await createTestUser({
      role: 'admin',
      school_id: school.school_id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid admin', async () => {
      const admin = await Admin.create({
        user_id: user.id,
      })
      expect(admin).toHaveProperty('user_id')
      expect(admin.user_id).toBe(user.id)
    })

    it('should fail without user_id', async () => {
      await expect(Admin.create({})).rejects.toThrow('user_id cannot be null')
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const found = await Admin.findOne({
        where: { user_id: admin.user_id },
        include: [{ model: User, as: 'user' }],
      })
      expect(found.user.id).toBe(user.id)
    })

    it('should have many enrollments', async () => {
      try {
        const admin = await Admin.create({
          user_id: user.id,
        })
        const enrollment = await Enrollment.create({
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'Student',
          birth_date: new Date('2000-01-01'),
          contact_no: '09123456789',
          year_level: 3,
          status: 'pending',
          handled_by_id: admin.user_id,
          school_id: school.school_id,
          enrollment_date: new Date(),
          password: 'securepassword123',
        })

        const found = await Admin.findOne({
          where: { user_id: admin.user_id },
          include: [{ model: Enrollment, as: 'enrollments' }],
        })
        expect(found.enrollments[0].id).toBe(enrollment.id)
      } catch (error) {
        console.error(error)
        throw error
      }
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      await Admin.create({ user_id: user.id })
      await expect(Admin.create({ user_id: user.id })).rejects.toThrow()
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete admin', async () => {
      const admin = await Admin.create({ user_id: user.id })
      await admin.destroy()
      const found = await Admin.findOne({
        where: { user_id: admin.user_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })

    it('should cascade delete when user is deleted', async () => {
      await Admin.create({ user_id: user.id })
      await user.destroy({ force: true })
      const adminCount = await Admin.count()
      expect(adminCount).toBe(0)
    })
  })

  describe('Attributes', () => {
    it('should have all required attributes', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const attributes = ['user_id', 'createdAt', 'updatedAt', 'deletedAt']
      attributes.forEach((attr) => {
        expect(admin).toHaveProperty(attr)
      })
    })
  })

  describe('Query Operations', () => {
    it('should find active admins', async () => {
      const admin = await Admin.create({ user_id: user.id })
      const found = await Admin.findAll({ where: { deletedAt: null } })
      expect(found).toHaveLength(1)
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

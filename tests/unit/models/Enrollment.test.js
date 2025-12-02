import { sequelize } from '../../../src/config/database.js'
import { Enrollment } from '../../../src/models/Enrollment.js'
import { School } from '../../../src/models/School.js'
import { User } from '../../../src/models/User.js'
import { Admin } from '../../../src/models/Admin.js'
import { createTestSchool, createTestUser, createAdminDirectly } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('Enrollment Model', () => {
  let school
  let admin
  let validEnrollmentData

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    admin = await createAdminDirectly(school)

    validEnrollmentData = {
      first_name: 'Test',
      last_name: 'Student',
      email: `test${Date.now()}@example.com`,
      password: 'securepassword123',
      birth_date: new Date('2000-01-01'),
      contact_no: '09123456789',
      year_level: 3,
      school_id: school.school_id,
      handled_by_id: admin.id,
      status: 'pending',
      enrollment_date: new Date(),
    }
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create valid enrollment', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      expect(enrollment).toHaveProperty('enrollment_id')
      expect(enrollment.email).toBe(validEnrollmentData.email)
    })
  })

  describe('Validation', () => {
    it('should require all mandatory fields', async () => {
      await expect(Enrollment.create({})).rejects.toThrow()
    })

    it('should validate email format', async () => {
      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          email: 'invalid-email',
        })
      ).rejects.toThrow('Email must be a valid email address')
    })

    it('should validate year level range', async () => {
      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          year_level: 7,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })

    it('should validate status values', async () => {
      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          status: 'invalid',
        })
      ).rejects.toThrow('Enrollment status must be one of the predefined types')
    })

    it('should not allow future birth dates', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          birth_date: futureDate,
        })
      ).rejects.toThrow('Birthdate must be in the past')
    })

    it('should allow valid past birth dates', async () => {
      const pastDate = new Date('2000-01-01')
      const enrollment = await Enrollment.create({
        ...validEnrollmentData,
        birth_date: pastDate,
      })
      expect(enrollment.birth_date).toEqual(pastDate)
    })
  })

  describe('Associations', () => {
    it('should associate with school', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      const found = await Enrollment.findOne({
        where: { enrollment_id: enrollment.enrollment_id },
        include: [{ model: School, as: 'school' }],
      })
      expect(found.school.school_id).toBe(school.school_id)
    })

    it('should associate with admin', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      const found = await Enrollment.findOne({
        where: { enrollment_id: enrollment.enrollment_id },
        include: [
          {
            model: Admin,
            as: 'admin',
            include: [
              {
                model: User,
                as: 'user',
              },
            ],
          },
        ],
      })

      expect(found.admin.user_id).toBe(validEnrollmentData.handled_by_id)
    })
  })

  describe('Status Management', () => {
    it('should update enrollment status', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      await enrollment.update({ status: 'approved' })
      expect(enrollment.status).toBe('approved')
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete enrollment', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      await enrollment.destroy()
      const found = await Enrollment.findOne({
        where: { enrollment_id: enrollment.enrollment_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })
  })

  describe('Query Operations', () => {
    it('should find enrollments by status', async () => {
      await Enrollment.create(validEnrollmentData)
      const enrollments = await Enrollment.findAll({
        where: { status: 'pending' },
      })
      expect(enrollments).toHaveLength(1)
    })

    it('should paginate enrollments', async () => {
      await Promise.all([
        Enrollment.create({ ...validEnrollmentData, email: 'test1@example.com' }),
        Enrollment.create({ ...validEnrollmentData, email: 'test2@example.com' }),
      ])

      const { count, rows } = await Enrollment.findAndCountAll({
        limit: 1,
        offset: 0,
      })

      expect(count).toBe(2)
      expect(rows).toHaveLength(1)
    })
  })

  describe('Data Updates', () => {
    it('should update enrollment details', async () => {
      const enrollment = await Enrollment.create(validEnrollmentData)
      await enrollment.update({
        first_name: 'Updated',
        last_name: 'Name',
      })
      expect(enrollment.first_name).toBe('Updated')
      expect(enrollment.last_name).toBe('Name')
    })
  })

  describe('Data Integrity', () => {
    it('should enforce unique email', async () => {
      await Enrollment.create(validEnrollmentData)
      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          email: validEnrollmentData.email,
        })
      ).rejects.toThrow()
    })

    it('should validate contact number format', async () => {
      await expect(
        Enrollment.create({
          ...validEnrollmentData,
          contact_no: 'invalid',
        })
      ).rejects.toThrow()
    })
  })
})

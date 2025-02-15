import { User } from '../../../src/models/User.js'
import { School } from '../../../src/models/School.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { Learner } from '../../../src/models/Learner.js'
import { validUsers, invalidUsers } from '../../fixtures/userData.js'
import { validSchools } from '../../fixtures/schoolData.js'
import { setupTestEnvironment, teardownTestEnvironment } from '../../helpers/testSetup.js'
import { hashPassword } from '../../helpers/testUtils.js'
import { createTestUser, createTestSchool, createTestEnrollment } from '../../helpers/testData.js'
import bcrypt from 'bcryptjs'
import '../../../src/models/associate.js'

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestEnvironment()
  })

  afterAll(async () => {
    await teardownTestEnvironment()
  })

  describe('Valid Users', () => {
    it('should create a user with valid data', async () => {
      const school = await createTestSchool()
      const userData = {
        ...validUsers[0],
        school_id: school.school_id,
      }
      const hashedPassword = await hashPassword(userData.password)

      const user = await User.create({
        ...userData,
        password: hashedPassword,
      })

      expect(user.id).toBeDefined()
      expect(user.first_name).toBe(userData.first_name)
      expect(user.last_name).toBe(userData.last_name)
      expect(user.email).toBe(userData.email)
      expect(user.role).toBe(userData.role)
      expect(user.school_id).toBe(userData.school_id)
    })

    it('should create user with valid birthdate in past', async () => {
      const school = await createTestSchool()
      const pastDate = new Date()
      pastDate.setFullYear(pastDate.getFullYear() - 20)

      const userData = {
        ...validUsers[0],
        email: `user${Date.now()}@example.com`,
        birth_date: pastDate,
        school_id: school.school_id,
      }
      const hashedPassword = await hashPassword(userData.password)

      const user = await User.create({ ...userData, password: hashedPassword })
      expect(user.birth_date).toEqual(pastDate)
    })
  })

  describe('Invalid Users', () => {
    invalidUsers.forEach((user, index) => {
      it(`should not create user with invalid data - case ${index + 1}`, async () => {
        try {
          await User.create(user)
        } catch (error) {
          expect(error).toBeDefined()
          expect(error.name).toBe('SequelizeValidationError')
        }
      })
    })

    it('should not create user with future birthdate', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      await expect(
        User.create({
          ...validUsers[0],
          birth_date: futureDate,
        })
      ).rejects.toThrow('Birthdate must be in the past')
    })

    it('should not create user with today as birthdate', async () => {
      const today = new Date()

      await expect(
        User.create({
          ...validUsers[0],
          email: `user${Date.now()}@example.com`,
          birth_date: today,
        })
      ).rejects.toThrow('Birthdate must be in the past')
    })
  })

  describe('Associations', () => {
    it('should belong to a school', async () => {
      const schoolData = {
        ...validSchools[0],
        name: 'Test School',
      }
      const school = await School.create(schoolData)
      const user = await createTestUser(
        {
          school_id: school.school_id,
        },
        'learner'
      )
      const userSchool = await user.getSchool()

      expect(userSchool.id).toBe(school.id)
      expect(userSchool.name).toBe('Test School')
    })

    it('should have one StudentTeacher', async () => {
      const userData = validUsers[2]
      const user = await User.create(userData)
      const studentTeacher = await user.createStudentTeacher({
        section: 'Test Section',
        department: 'Test Department',
      })

      expect(studentTeacher).toBeTruthy()
      expect(studentTeacher.user_id).toBe(user.id)
    })

    it('should have one Teacher', async () => {
      const userData = validUsers[1]
      const user = await User.create(userData)
      const teacher = await user.createTeacher({
        department: 'Test Department',
        emp_status: 'Full-time',
      })

      expect(teacher).toBeTruthy()
      expect(teacher.user_id).toBe(user.id)
    })

    it('should have one Admin', async () => {
      const userData = validUsers[3]
      const user = await User.create(userData)
      const admin = await user.createAdmin()

      expect(admin).toBeTruthy()
      expect(admin.user_id).toBe(user.id)
    })

    it('should have one Learner', async () => {
      const school = await createTestSchool()
      const enrollment = await createTestEnrollment({
        email: `learner${Date.now()}@example.com`,
        school_id: school.school_id,
        enrollment_date: new Date(),
      })

      const userData = {
        ...validUsers[0],
        email: `user${Date.now()}@example.com`,
        school_id: school.school_id,
        role: 'learner',
      }
      const user = await User.create(userData)

      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      expect(learner).toBeTruthy()
      expect(learner.user_id).toBe(user.id)
      expect(learner.enrollment_id).toBe(enrollment.enrollment_id)
    })

    it('should cascade soft delete to associated roles', async () => {
      const user = await createTestUser({}, 'teacher')

      // Create teacher role
      const teacher = await user.createTeacher({
        department: 'Test Department',
        emp_status: 'Full-time',
      })
      expect(teacher).toBeTruthy()

      // Soft delete user
      await user.destroy()

      // Check teacher soft deleted
      const deletedTeacher = await Teacher.findOne({
        where: { user_id: user.id },
        paranoid: false,
      })

      expect(deletedTeacher).toBeTruthy()
      expect(deletedTeacher.deletedAt).toBeDefined()
    })
  })

  describe('Password Management', () => {
    it('should hash password on create', async () => {
      const user = await createTestUser()
      expect(user.password).not.toBe('securepassword')
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/)
    })

    it('should rehash password on update', async () => {
      const user = await createTestUser()
      const oldHash = user.password
      await user.update({ password: 'newpassword123' })
      expect(user.password).not.toBe(oldHash)
    })

    it('should have comparePassword instance method', async () => {
      const user = await createTestUser()
      expect(typeof user.comparePassword).toBe('function')
    })
  })

  describe('Data Validation', () => {
    it('should enforce contact number format', async () => {
      await expect(
        createTestUser({
          contact_no: 'invalid',
        })
      ).rejects.toThrow()
    })

    it('should enforce unique email', async () => {
      const user1 = await createTestUser()
      await expect(
        createTestUser({
          email: user1.email,
        })
      ).rejects.toThrow('Email already exists')
    })

    it('should validate email format', async () => {
      await expect(
        createTestUser({
          email: 'invalid-email',
        })
      ).rejects.toThrow()
    })

    it('should require school_id', async () => {
      await expect(
        createTestUser({
          school_id: null,
        })
      ).rejects.toThrow()
    })
  })

  describe('Role Management', () => {
    it('should enforce valid role types', async () => {
      await expect(
        createTestUser({
          role: 'invalid',
        })
      ).rejects.toThrow('Invalid role type')
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete user', async () => {
      const user = await createTestUser()
      await user.destroy()
      const deletedUser = await User.findByPk(user.id, { paranoid: false })
      expect(deletedUser.deletedAt).toBeDefined()
    })

    it('should restore soft deleted user', async () => {
      const user = await createTestUser()
      await user.destroy()
      await user.restore()
      const restoredUser = await User.findByPk(user.id)
      expect(restoredUser).toBeTruthy()
      expect(restoredUser.deletedAt).toBeNull()
    })
  })

  describe('Update Operations', () => {
    it('should update user details', async () => {
      const user = await createTestUser()
      const newData = {
        first_name: 'Updated',
        last_name: 'Name',
      }
      await user.update(newData)
      expect(user.first_name).toBe('Updated')
      expect(user.last_name).toBe('Name')
    })
  })

  describe('Query Operations', () => {
    it('should find user by email', async () => {
      const user = await createTestUser()
      const found = await User.findOne({ where: { email: user.email } })
      expect(found.id).toBe(user.id)
    })

    it('should not return soft deleted users in normal queries', async () => {
      const user = await createTestUser()
      await user.destroy()
      const found = await User.findByPk(user.id)
      expect(found).toBeNull()
    })
  })

  describe('Attributes', () => {
    it('should have all required attributes', async () => {
      const user = await createTestUser()
      const attributes = [
        'id',
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'birth_date',
        'contact_no',
        'school_id',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]
      attributes.forEach((attr) => {
        expect(user).toHaveProperty(attr)
      })
    })
  })

  describe('Instance Methods', () => {
    it('should compare password correctly', async () => {
      const plainPassword = 'securepassword'
      const user = await createTestUser({
        password: plainPassword,
      })
      const isMatch = await bcrypt.compare(plainPassword, user.password)
      expect(isMatch).toBe(true)
    })

    it('should verify correct password with comparePassword', async () => {
      const plainPassword = 'securepassword'
      const user = await createTestUser({
        password: plainPassword,
      })

      const isMatch = await user.comparePassword(plainPassword)
      expect(isMatch).toBe(true)
    })

    it('should reject incorrect password with comparePassword', async () => {
      const user = await createTestUser({
        password: 'correctpassword',
      })

      const isMatch = await user.comparePassword('wrongpassword')
      expect(isMatch).toBe(false)
    })
  })

  describe('Data Sanitization', () => {
    it('should trim whitespace from string fields', async () => {
      const user = await createTestUser({
        first_name: '  John  ',
        last_name: '  Doe  ',
        email: `test${Date.now()}@example.com`,
        school_id: (await createTestSchool()).school_id,
      })
      expect(user.first_name).toBe('John')
      expect(user.last_name).toBe('Doe')
    })
  })

  describe('Error Handling', () => {
    it('should handle concurrent updates correctly', async () => {
      const user = await createTestUser()
      await Promise.all([
        user.update({ first_name: 'Test1' }),
        user.update({ first_name: 'Test2' }),
      ])
      const updatedUser = await User.findByPk(user.id)
      expect(updatedUser.first_name).toBeDefined()
    })
  })
})

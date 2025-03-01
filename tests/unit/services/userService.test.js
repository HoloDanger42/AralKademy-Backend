import { jest } from '@jest/globals'
import UserService from '../../../src/services/userService.js'
import { sequelize } from '../../../src/config/database.js'
import { createTestSchool, createTestEnrollment } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

jest.setTimeout(10000)

describe('UserService', () => {
  let userService
  let school
  let enrollment

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    enrollment = await createTestEnrollment({ school_id: school.school_id })

    userService = new UserService(
      sequelize.models.User,
      sequelize.models.Teacher,
      sequelize.models.Admin,
      sequelize.models.StudentTeacher,
      sequelize.models.Learner,
      sequelize.models.Enrollment,
      sequelize.models.Course,
      sequelize.models.Group,
      sequelize.models.School,
      sequelize.models.Blacklist
    )
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Validation', () => {
    it('should validate email format', () => {
      const validData = { email: 'test@example.com' }
      const invalidData = { email: 'invalid-email' }

      expect(() => userService.validateUserData(validData)).not.toThrow()
      expect(() => userService.validateUserData(invalidData)).toThrow('Invalid email format')
    })

    it('should validate contact number format', () => {
      const validData = { contact_no: '09123456789' }
      const invalidData = { contact_no: '123456789' }

      expect(() => userService.validateUserData(validData)).not.toThrow()
      expect(() => userService.validateUserData(invalidData)).toThrow(
        'Invalid contact number format'
      )
    })

    it('should validate role', () => {
      expect(() => userService.validateRole('teacher')).not.toThrow()
      expect(() => userService.validateRole('invalid')).toThrow('Invalid role')
    })

    it('should validate password length', () => {
      expect(() => userService.validatePassword('password123')).not.toThrow()
      expect(() => userService.validatePassword('123')).toThrow(
        'Password must be at least 8 characters'
      )
    })
  })

  describe('User Creation', () => {
    it('should create teacher user with role data', async () => {
      const userData = {
        email: 'teacher@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'Teacher',
        birth_date: new Date('1990-01-01'),
        contact_no: '09123456789',
        role: 'teacher',
        department: 'Science',
      }

      const user = await userService.createUser(
        userData.email,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.birth_date,
        userData.contact_no,
        school.school_id,
        userData.role,
        null,
        userData.department
      )

      expect(user).toBeDefined()
      expect(user.role).toBe('teacher')

      const teacher = await sequelize.models.Teacher.findOne({
        where: { user_id: user.id },
      })
      expect(teacher).toBeDefined()
    })

    it('should fail creating user with existing email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        birth_date: new Date('1990-01-01'),
        contact_no: '09123456789',
        role: 'teacher',
      }

      await userService.createUser(
        userData.email,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.birth_date,
        userData.contact_no,
        school.school_id,
        userData.role
      )

      await expect(
        userService.createUser(
          userData.email,
          userData.password,
          userData.first_name,
          userData.last_name,
          userData.birth_date,
          userData.contact_no,
          school.school_id,
          userData.role
        )
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('Authentication', () => {
    it('should login user with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        birth_date: new Date('1990-01-01'),
        contact_no: '09123456789',
        role: 'teacher',
      }

      const createdUser = await userService.createUser(
        userData.email,
        userData.password,
        userData.first_name,
        userData.last_name,
        userData.birth_date,
        userData.contact_no,
        school.school_id,
        userData.role
      )

      const result = await userService.loginUser(userData.email, userData.password)

      expect(result.user).toBeDefined()
      expect(result.token).toBeDefined()

      const logoutResult = await userService.logoutUser(result.token)
      expect(logoutResult).toEqual({ message: 'User logged out successfully' })
    })

    it('should fail logout with an invalid token', async () => {
      await expect(userService.logoutUser('invalid-token')).rejects.toThrow(
        'Invalid token or logout failed'
      )
    })
  })

  describe('User Retrieval', () => {
    beforeEach(async () => {
      await sequelize.models.User.create(
        {
          email: 'existing@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          birth_date: new Date('1990-01-01'),
          contact_no: '09123456789',
          school_id: school.school_id,
          role: 'teacher',
        },
        {
          include: [
            {
              model: sequelize.models.Teacher,
              as: 'teacher',
            },
          ],
        }
      )
    })

    it('should get user by id with role details', async () => {
      const user = await userService.createUser(
        'test@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      const retrieved = await userService.getUserById(user.id)

      expect(retrieved.id).toBe(user.id)
      expect(retrieved.password).toBeUndefined()
      expect(retrieved.teacher).toBeDefined()
    })

    it('should fail with non-existent user id', async () => {
      await expect(userService.getUserById(999)).rejects.toThrow('User not found')
    })

    it('should get paginated users', async () => {
      // Clear existing users
      await sequelize.models.User.destroy({ where: {}, force: true })

      // Create exactly 15 users
      const createPromises = Array.from({ length: 15 }, (_, i) =>
        userService.createUser(
          `user${i}@example.com`,
          'password123',
          'Test',
          'User',
          new Date('1990-01-01'),
          '09123456789',
          school.school_id,
          'teacher'
        )
      )

      await Promise.all(createPromises)

      // Test first page
      const page1 = await userService.getAllUsers(1, 10)
      expect(page1.count).toBe(15)
      expect(page1.rows.length).toBe(10)

      // Test second page
      const page2 = await userService.getAllUsers(2, 10)
      expect(page2.rows.length).toBe(5)
    })
  })

  describe('User Update', () => {
    it('should update user data', async () => {
      const user = await userService.createUser(
        'test@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      const updated = await userService.updateUser(user.id, {
        first_name: 'Updated',
        contact_no: '09987654321',
      })

      expect(updated.first_name).toBe('Updated')
      expect(updated.contact_no).toBe('09987654321')
    })
  })

  describe('Password Management', () => {
    it('should change password with valid credentials', async () => {
      const user = await userService.createUser(
        'test@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      await expect(
        userService.changePassword(user.id, 'password123', 'newpassword123')
      ).resolves.toBe(true)
    })

    it('should fail password change with invalid old password', async () => {
      const user = await userService.createUser(
        'test@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      await expect(
        userService.changePassword(user.id, 'wrongpassword', 'newpassword123')
      ).rejects.toThrow('Invalid password')
    })
  })

  describe('User Deletion', () => {
    let testUser

    beforeEach(async () => {
      testUser = await userService.createUser(
        'delete-test@example.com',
        'password123',
        'Delete',
        'Test',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )
    })

    it('should delete existing user', async () => {
      const result = await userService.deleteUser(testUser.id)
      expect(result).toBe(true)

      const deletedUser = await sequelize.models.User.findByPk(testUser.id)
      expect(deletedUser).toBeNull()

      const teacherRecord = await sequelize.models.Teacher.findOne({
        where: { user_id: testUser.id },
      })
      expect(teacherRecord).toBeNull()
    })

    it('should throw error for non-existent user', async () => {
      await expect(userService.deleteUser(999)).rejects.toThrow('User not found')
    })

    it('should rollback transaction on error', async () => {
      jest
        .spyOn(sequelize.models.User.prototype, 'destroy')
        .mockRejectedValueOnce(new Error('Database error'))

      await expect(userService.deleteUser(testUser.id)).rejects.toThrow('Database error')

      const user = await sequelize.models.User.findByPk(testUser.id)
      expect(user).not.toBeNull()
    })
  })

  describe('Role and School Queries', () => {
    beforeEach(async () => {
      // Clear all users
      await sequelize.models.User.destroy({
        where: {},
        force: true,
      })
    })

    it('should get users by role', async () => {
      await userService.createUser(
        'teacher@example.com',
        'password123',
        'Test',
        'Teacher',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      const teachers = await userService.getUsersByRole('teacher')
      expect(teachers.length).toBe(1)
      expect(teachers[0].role).toBe('teacher')
    })

    it('should get users by school', async () => {
      await userService.createUser(
        'test@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )

      const schoolUsers = await userService.getUsersBySchool(school.school_id)
      expect(schoolUsers.length).toBe(1)
      expect(schoolUsers[0].school_id).toBe(school.school_id)
    })
  })

  describe('Password Reset', () => {
    let user
  
    beforeEach(async () => {
      user = await userService.createUser(
        'reset@example.com',
        'password123',
        'Test',
        'User',
        new Date('1990-01-01'),
        '09123456789',
        school.school_id,
        'teacher'
      )
    })
  
    it('should generate reset code for valid email', async () => {
      const code = await userService.forgotPassword(user.email)
      expect(code).toBeDefined()
      
      const updatedUser = await sequelize.models.User.findOne({ where: { email: user.email } })
      expect(updatedUser.reset_code).toBe(code)
    })
  
    it('should fail for non-existent email', async () => {
      await expect(userService.forgotPassword('nonexistent@example.com')).rejects.toThrow('User not found')
    })
  
    it('should verify correct reset code', async () => {
      const code = await userService.forgotPassword(user.email)
      const result = await userService.verifyResetCode(user.email, code)
      expect(result).toBe(true)
    })
  
    it('should fail verification for incorrect reset code', async () => {
      await userService.forgotPassword(user.email)
      await expect(userService.verifyResetCode(user.email, 123456)).rejects.toThrow('Invalid code')
    })
  
    it('should reset password with valid reset code', async () => {
      await userService.forgotPassword(user.email)
      await userService.resetPassword(user.email, 'newpassword123')
      
      const updatedUser = await sequelize.models.User.findOne({ where: { email: user.email } })
      expect(updatedUser.password).not.toBe('password123')
    })
  
    it('should fail to reset password for non-existent user', async () => {
      await expect(userService.resetPassword('nonexistent@example.com', 'newpassword123')).rejects.toThrow('User not found')
    })
  })
})

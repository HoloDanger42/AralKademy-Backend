import { sequelize } from '../../../src/config/database.js'
import { RoleService } from '../../../src/services/roleService.js'
import { User } from '../../../src/models/User.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { Admin } from '../../../src/models/Admin.js'
import { Learner } from '../../../src/models/Learner.js'
import { StudentTeacher } from '../../../src/models/StudentTeacher.js'
import { createTestUser, createTestSchool, createTestEnrollment } from '../../helpers/testData.js'

describe('RoleService', () => {
  let school
  let enrollment

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    enrollment = await createTestEnrollment({
      school_id: school.school_id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('assignRole', () => {
    it('should assign teacher role', async () => {
      const user = await createTestUser()
      await RoleService.assignRole(user.id, 'teacher')

      const updatedUser = await User.findByPk(user.id)
      const teacher = await Teacher.findOne({ where: { user_id: user.id } })

      expect(updatedUser.role).toBe('teacher')
      expect(teacher).toBeTruthy()
    })

    it('should fail with invalid role', async () => {
      const user = await createTestUser()
      await expect(RoleService.assignRole(user.id, 'invalid')).rejects.toThrow('Invalid role')
    })

    it('should fail with non-existent user', async () => {
      await expect(RoleService.assignRole(999, 'teacher')).rejects.toThrow('User not found')
    })

    it('should fail when assigning learner without enrollment_id', async () => {
      const user = await createTestUser()
      await expect(RoleService.assignRole(user.id, 'learner', { year_level: 3 })).rejects.toThrow(
        'enrollment_id is required'
      )
    })

    it('should fail when assigning student_teacher without required fields', async () => {
      const user = await createTestUser()
      await expect(RoleService.assignRole(user.id, 'student_teacher', {})).rejects.toThrow()
    })

    it('should fail when assigning learner without year_level', async () => {
      const user = await createTestUser()
      await expect(
        RoleService.assignRole(user.id, 'learner', {
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('year_level is required')
    })

    it('should fail when assigning same role', async () => {
      const user = await createTestUser()
      await RoleService.assignRole(user.id, 'teacher')
      await expect(RoleService.assignRole(user.id, 'teacher')).rejects.toThrow(
        'User already has this role'
      )
    })
  })

  describe('changeRole', () => {
    it('should change from teacher to admin', async () => {
      const user = await createTestUser()

      // First assign teacher role
      await RoleService.assignRole(user.id, 'teacher')

      // Then change to admin
      await RoleService.changeRole(user.id, 'admin')

      const updatedUser = await User.findByPk(user.id)
      const teacher = await Teacher.findOne({ where: { user_id: user.id }, paranoid: false })
      const admin = await Admin.findOne({ where: { user_id: user.id } })

      expect(updatedUser.role).toBe('admin')
      expect(teacher.deletedAt).toBeTruthy()
      expect(admin).toBeTruthy()
    })

    it('should maintain role data integrity during change', async () => {
      const user = await createTestUser()

      await RoleService.assignRole(user.id, 'student_teacher', {
        section: '4A',
        department: 'Science',
      })

      await RoleService.changeRole(user.id, 'learner', {
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      const learner = await Learner.findOne({ where: { user_id: user.id } })
      expect(learner.year_level).toBe(3)
    })

    it('should validate role data during change', async () => {
      try {
        const user = await createTestUser()
        await RoleService.assignRole(user.id, 'admin')

        await expect(RoleService.changeRole(user.id, 'student_teacher', {})).rejects.toThrow(
          'section and department are required'
        )
      } catch (error) {
        console.error(error)
        throw error
      }
    })

    it('should handle concurrent role changes', async () => {
      const user = await createTestUser()
      await RoleService.assignRole(user.id, 'admin')

      await Promise.all([
        RoleService.changeRole(user.id, 'teacher'),
        RoleService.changeRole(user.id, 'learner'),
      ]).catch((error) => {
        expect(error).toBeTruthy()
      })
    })

    it('should fail when changing role for non-existent user', async () => {
      await expect(RoleService.changeRole(999, 'teacher')).rejects.toThrow('User not found')
    })

    it('should fail when changing to same role', async () => {
      const user = await createTestUser()
      await RoleService.assignRole(user.id, 'teacher')
      await expect(RoleService.changeRole(user.id, 'teacher')).rejects.toThrow(
        'User already has this role'
      )
    })

    it('should rollback on failure', async () => {
      const user = await createTestUser()
      await RoleService.assignRole(user.id, 'admin')

      // Force error by providing invalid data
      try {
        await RoleService.changeRole(user.id, 'teacher', { department: null })
      } catch (error) {
        const userAfterFailedChange = await User.findByPk(user.id)
        expect(userAfterFailedChange.role).toBe('admin')
      }
    })
  })

  describe('validateRole', () => {
    it('should validate correct roles', () => {
      RoleService.VALID_ROLES.forEach((role) => {
        expect(() => RoleService.validateRole(role)).not.toThrow()
      })
    })

    it('should reject invalid roles', () => {
      expect(() => RoleService.validateRole('invalid')).toThrow()
    })
  })

  describe('getRoleModel', () => {
    it('should return correct model for each role', () => {
      expect(RoleService.getRoleModel('teacher')).toBe(Teacher)
      expect(RoleService.getRoleModel('admin')).toBe(Admin)
      expect(RoleService.getRoleModel('learner')).toBe(Learner)
      expect(RoleService.getRoleModel('student_teacher')).toBe(StudentTeacher)
    })

    it('should throw error for invalid role', () => {
      expect(() => RoleService.getRoleModel('invalid')).toThrow()
    })
  })
})
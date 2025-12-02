import { sequelize } from '../../../src/config/database.js'
import { StudentTeacher } from '../../../src/models/StudentTeacher.js'
import { User } from '../../../src/models/User.js'
import { Group } from '../../../src/models/Group.js'
import { createTestUser, createTestGroup } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('StudentTeacher Model', () => {
  let user
  let group

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    user = await createTestUser({ role: 'student_teacher' })
    group = await createTestGroup({ group_type: 'student_teacher' })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid student teacher', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
        student_teacher_group_id: group.group_id,
      })

      expect(st).toHaveProperty('user_id')
      expect(st.section).toBe('4A')
      expect(st.department).toBe('Science')
    })

    it('should fail without required fields', async () => {
      await expect(StudentTeacher.create({})).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should require section', async () => {
      await expect(
        StudentTeacher.create({
          user_id: user.id,
          department: 'Science',
        })
      ).rejects.toThrow('Section is required')
    })

    it('should require department', async () => {
      await expect(
        StudentTeacher.create({
          user_id: user.id,
          section: '4A',
        })
      ).rejects.toThrow('Department is required')
    })

    it('should not allow empty section', async () => {
      await expect(
        StudentTeacher.create({
          user_id: user.id,
          section: '',
          department: 'Science',
        })
      ).rejects.toThrow('Section cannot be empty')
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })

      const found = await StudentTeacher.findOne({
        where: { user_id: st.user_id },
        include: [{ model: User, as: 'user' }],
      })

      expect(found.user.id).toBe(user.id)
    })

    it('should associate with group', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
        student_teacher_group_id: group.group_id,
      })

      const found = await StudentTeacher.findOne({
        where: { user_id: st.user_id },
        include: [{ model: Group, as: 'group' }],
      })

      expect(found.group.group_id).toBe(group.group_id)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })

      await expect(
        StudentTeacher.create({
          user_id: user.id,
          section: '4B',
          department: 'Math',
        })
      ).rejects.toThrow()
    })
  })

  describe('Query Operations', () => {
    it('should find by department', async () => {
      await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })

      const found = await StudentTeacher.findOne({
        where: { department: 'Science' },
      })

      expect(found).toBeTruthy()
      expect(found.department).toBe('Science')
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete student teacher', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })
      await st.destroy()
      const found = await StudentTeacher.findOne({
        where: { user_id: st.user_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })

    it('should cascade delete when user is deleted', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })
      await user.destroy({ force: true })
      const stCount = await StudentTeacher.count()
      expect(stCount).toBe(0)
    })
  })

  describe('Updates', () => {
    it('should update student teacher details', async () => {
      const st = await StudentTeacher.create({
        user_id: user.id,
        section: '4A',
        department: 'Science',
      })
      await st.update({ section: '4B', department: 'Math' })
      expect(st.section).toBe('4B')
      expect(st.department).toBe('Math')
    })
  })
})

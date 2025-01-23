import { sequelize } from '../../../src/config/database.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { User } from '../../../src/models/User.js'
import { Course } from '../../../src/models/Course.js'
import { createTestUser, createTestGroup } from '../../helpers/testData.js'
import models from '../../../src/models/associate.js'

describe('Teacher Model', () => {
  let user
  let stGroup
  let learnerGroup

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    user = await createTestUser({ role: 'teacher' })
    stGroup = await createTestGroup({ group_type: 'student_teacher' })
    learnerGroup = await createTestGroup({ group_type: 'learner' })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid teacher', async () => {
      const teacher = await Teacher.create({
        user_id: user.id,
      })

      expect(teacher).toHaveProperty('user_id')
      expect(teacher.user_id).toBe(user.id)
    })

    it('should fail without user_id', async () => {
      await expect(Teacher.create({})).rejects.toThrow('user_id cannot be null')
    })

    it('should fail with non-existent user_id', async () => {
      await expect(Teacher.create({ user_id: 99999 })).rejects.toThrow('foreign key constraint')
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      const teacher = await Teacher.create({ user_id: user.id })
      const found = await Teacher.findOne({
        where: { user_id: teacher.user_id },
        include: [{ model: User, as: 'user' }],
      })

      expect(found.user.id).toBe(user.id)
    })

    it('should have many courses', async () => {
      const teacher = await Teacher.create({ user_id: user.id })
      const course = await Course.create({
        name: 'Test Course',
        user_id: teacher.user_id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      const found = await Teacher.findOne({
        where: { user_id: teacher.user_id },
        include: [{ model: Course, as: 'courses' }],
      })

      expect(found.courses[0].id).toBe(course.id)
    })
  })

  describe('Deletion', () => {
    it('should soft delete teacher', async () => {
      const teacher = await Teacher.create({ user_id: user.id })
      await teacher.destroy()

      const found = await Teacher.findOne({
        where: { user_id: teacher.user_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })

    it('should cascade delete when user is deleted', async () => {
      await Teacher.create({ user_id: user.id })
      await user.destroy({ force: true })

      const teacherCount = await Teacher.count()
      expect(teacherCount).toBe(0)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      await Teacher.create({ user_id: user.id })
      await expect(Teacher.create({ user_id: user.id })).rejects.toThrow('User ID must be unique')
    })
  })

  describe('Course Management', () => {
    it('should allow multiple courses', async () => {
      const teacher = await Teacher.create({ user_id: user.id })
      await Course.create({
        name: 'Course 1',
        user_id: teacher.user_id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })
      await Course.create({
        name: 'Course 2',
        user_id: teacher.user_id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      const found = await Teacher.findOne({
        where: { user_id: teacher.user_id },
        include: [{ model: Course, as: 'courses' }],
      })
      expect(found.courses.length).toBe(2)
    })

    it('should cascade delete courses when teacher is deleted', async () => {
      const teacher = await Teacher.create({ user_id: user.id })
      await Course.create({
        name: 'Test Course',
        user_id: teacher.user_id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      await teacher.destroy({ force: true })
      const courseCount = await Course.count()
      expect(courseCount).toBe(0)
    })
  })
})

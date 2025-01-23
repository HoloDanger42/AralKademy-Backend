import { sequelize } from '../../../src/config/database.js'
import { Course } from '../../../src/models/Course.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { Group } from '../../../src/models/Group.js'
import { createTestUser, createTestGroup } from '../../helpers/testData.js'
import models from '../../../src/models/associate.js'

describe('Course Model', () => {
  let teacher
  let stGroup
  let learnerGroup

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    teacher = await createTestUser({ role: 'teacher' })
    await Teacher.create({ user_id: teacher.id })
    stGroup = await createTestGroup({ group_type: 'student_teacher' })
    learnerGroup = await createTestGroup({ group_type: 'learner' })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid course', async () => {
      const course = await Course.create({
        name: 'Test Course',
        description: 'Test Description',
        user_id: teacher.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      expect(course).toHaveProperty('id')
      expect(course.name).toBe('Test Course')
    })

    it('should fail without required fields', async () => {
      await expect(Course.create({})).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should validate name length', async () => {
      await expect(
        Course.create({
          name: 'a'.repeat(256),
          user_id: teacher.id,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('Course name must be between 1 and 255 characters')
    })

    it('should validate description length', async () => {
      await expect(
        Course.create({
          name: 'Test Course',
          description: 'a'.repeat(1001),
          user_id: teacher.id,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('Course description must be less than 1000 characters')
    })

    it('should fail with empty course name', async () => {
      await expect(
        Course.create({
          name: '',
          user_id: teacher.id,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('Course name is required')
    })

    it('should fail with non-existent teacher_id', async () => {
      await expect(
        Course.create({
          name: 'Test Course',
          user_id: 99999,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('foreign key constraint')
    })

    it('should fail with non-existent student_teacher_group_id', async () => {
      await expect(
        Course.create({
          name: 'Test Course',
          user_id: teacher.id,
          student_teacher_group_id: 99999,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('foreign key constraint')
    })
  })

  describe('Associations', () => {
    it('should associate with teacher', async () => {
      const course = await Course.create({
        name: 'Test Course',
        user_id: teacher.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      const found = await Course.findOne({
        where: { id: course.id },
        include: [{ model: Teacher, as: 'teacher' }],
      })

      expect(found.teacher.user_id).toBe(teacher.id)
    })

    it('should associate with groups', async () => {
      const course = await Course.create({
        name: 'Test Course',
        user_id: teacher.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      const found = await Course.findOne({
        where: { id: course.id },
        include: [
          { model: Group, as: 'studentTeacherGroup' },
          { model: Group, as: 'learnerGroup' },
        ],
      })

      expect(found.studentTeacherGroup.group_id).toBe(stGroup.group_id)
      expect(found.learnerGroup.group_id).toBe(learnerGroup.group_id)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique course name', async () => {
      await Course.create({
        name: 'Test Course',
        user_id: teacher.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      await expect(
        Course.create({
          name: 'Test Course',
          user_id: teacher.id,
          student_teacher_group_id: stGroup.group_id,
          learner_group_id: learnerGroup.group_id,
        })
      ).rejects.toThrow('Course name already exists')
    })
  })

  describe('Cascade Behavior', () => {
    it('should delete course when teacher is deleted', async () => {
      await Course.create({
        name: 'Test Course',
        user_id: teacher.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      expect(await Course.count()).toBe(1)

      await teacher.destroy({ force: true })

      const courseCount = await Course.count()
      expect(courseCount).toBe(0)
    })
  })
})

<<<<<<< HEAD
import { sequelize } from '../../../src/config/database.js'
import { Group } from '../../../src/models/Group.js'
import { Learner } from '../../../src/models/Learner.js'
import { StudentTeacher } from '../../../src/models/StudentTeacher.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { Course } from '../../../src/models/Course.js'
import { createTestUser, createTestEnrollment, createTestSchool } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('Group Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
      expect(group).toHaveProperty('group_id')
      expect(group.name).toBe('Test Group')
      expect(group.group_type).toBe('learner')
    })

    it('should fail without required fields', async () => {
      await expect(Group.create({})).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should validate group type', async () => {
      await expect(
        Group.create({
          name: 'Test Group',
          group_type: 'invalid',
        })
      ).rejects.toThrow('Group type must be one of the predefined types')
    })

    it('should not allow empty name', async () => {
      await expect(
        Group.create({
          name: '',
          group_type: 'learner',
        })
      ).rejects.toThrow('Group name cannot be empty')
    })
  })

  describe('Associations', () => {
    let group

    beforeEach(async () => {
      group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
    })

    it('should have many learners', async () => {
      const school = await createTestSchool()
      const user = await createTestUser({ school_id: school.school_id })
      const enrollment = await createTestEnrollment({ school_id: school.school_id })

      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
        learner_group_id: group.group_id,
      })

      const found = await Group.findOne({
        where: { group_id: group.group_id },
        include: [{ model: Learner, as: 'learners' }],
      })

      expect(found.learners[0].id).toBe(learner.id)
    })

    it('should have many student teachers when type is student_teacher', async () => {
      const stGroup = await Group.create({
        name: 'ST Group',
        group_type: 'student_teacher',
      })

      const user = await createTestUser({ role: 'student_teacher' })
      const studentTeacher = await StudentTeacher.create({
        user_id: user.id,
        student_teacher_group_id: stGroup.group_id,
        section: '4A',
        department: 'Science',
      })

      const found = await Group.findOne({
        where: { group_id: stGroup.group_id },
        include: [{ model: StudentTeacher, as: 'studentTeachers' }],
      })

      expect(found.studentTeachers[0].id).toBe(studentTeacher.id)
    })
  })

  describe('Query Operations', () => {
    it('should find groups by type', async () => {
      await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })

      const groups = await Group.findAll({
        where: { group_type: 'learner' },
      })
      expect(groups).toHaveLength(1)
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
      await group.destroy()
      const found = await Group.findOne({
        where: { group_id: group.group_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })
  })

  describe('Course Associations', () => {
    it('should associate with courses', async () => {
      // Setup
      const teacherUser = await createTestUser({ role: 'teacher' })
      await Teacher.create({ user_id: teacherUser.id })

      const stGroup = await Group.create({
        name: 'ST Group',
        group_type: 'student_teacher',
      })
      const learnerGroup = await Group.create({
        name: 'Learner Group',
        group_type: 'learner',
      })

      const course = await Course.create({
        name: 'Test Course',
        user_id: teacherUser.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      // Test student teacher course
      const foundST = await Group.findOne({
        where: { group_id: stGroup.group_id },
        include: [{ model: Course, as: 'studentTeacherCourses' }],
      })
      expect(foundST.studentTeacherCourses[0].id).toBe(course.id)

      // Test learner course
      const foundLearner = await Group.findOne({
        where: { group_id: learnerGroup.group_id },
        include: [{ model: Course, as: 'learnerCourses' }],
      })
      expect(foundLearner.learnerCourses[0].id).toBe(course.id)
    })
  })

  describe('Updates', () => {
    it('should update group name', async () => {
      const group = await Group.create({
        name: 'Old Name',
        group_type: 'learner',
      })
      await group.update({ name: 'New Name' })
      expect(group.name).toBe('New Name')
    })
  })

  describe('Cascade Delete', () => {
    it('should handle associations on delete', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })

      await group.destroy()
      const associatedCourses = await Course.count({
        where: { learner_group_id: group.group_id },
      })
      expect(associatedCourses).toBe(0)
    })
  })
})
=======
import { sequelize } from '../../../src/config/database.js'
import { Group } from '../../../src/models/Group.js'
import { Learner } from '../../../src/models/Learner.js'
import { StudentTeacher } from '../../../src/models/StudentTeacher.js'
import { Teacher } from '../../../src/models/Teacher.js'
import { Course } from '../../../src/models/Course.js'
import { createTestUser, createTestEnrollment, createTestSchool } from '../../helpers/testData.js'
import '../../../src/models/associate.js'

describe('Group Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
      expect(group).toHaveProperty('group_id')
      expect(group.name).toBe('Test Group')
      expect(group.group_type).toBe('learner')
    })

    it('should fail without required fields', async () => {
      await expect(Group.create({})).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should validate group type', async () => {
      await expect(
        Group.create({
          name: 'Test Group',
          group_type: 'invalid',
        })
      ).rejects.toThrow('Group type must be one of the predefined types')
    })

    it('should not allow empty name', async () => {
      await expect(
        Group.create({
          name: '',
          group_type: 'learner',
        })
      ).rejects.toThrow('Group name cannot be empty')
    })
  })

  describe('Associations', () => {
    let group

    beforeEach(async () => {
      group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
    })

    it('should have many learners', async () => {
      const school = await createTestSchool()
      const user = await createTestUser({ school_id: school.school_id })
      const enrollment = await createTestEnrollment({ school_id: school.school_id })

      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
        learner_group_id: group.group_id,
      })

      const found = await Group.findOne({
        where: { group_id: group.group_id },
        include: [{ model: Learner, as: 'learners' }],
      })

      expect(found.learners[0].id).toBe(learner.id)
    })

    it('should have many student teachers when type is student_teacher', async () => {
      const stGroup = await Group.create({
        name: 'ST Group',
        group_type: 'student_teacher',
      })

      const user = await createTestUser({ role: 'student_teacher' })
      const studentTeacher = await StudentTeacher.create({
        user_id: user.id,
        student_teacher_group_id: stGroup.group_id,
        section: '4A',
        department: 'Science',
      })

      const found = await Group.findOne({
        where: { group_id: stGroup.group_id },
        include: [{ model: StudentTeacher, as: 'studentTeachers' }],
      })

      expect(found.studentTeachers[0].id).toBe(studentTeacher.id)
    })
  })

  describe('Query Operations', () => {
    it('should find groups by type', async () => {
      await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })

      const groups = await Group.findAll({
        where: { group_type: 'learner' },
      })
      expect(groups).toHaveLength(1)
    })
  })

  describe('Soft Delete', () => {
    it('should soft delete group', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })
      await group.destroy()
      const found = await Group.findOne({
        where: { group_id: group.group_id },
        paranoid: false,
      })
      expect(found.deletedAt).toBeTruthy()
    })
  })

  describe('Course Associations', () => {
    it('should associate with courses', async () => {
      // Setup
      const teacherUser = await createTestUser({ role: 'teacher' })
      await Teacher.create({ user_id: teacherUser.id })

      const stGroup = await Group.create({
        name: 'ST Group',
        group_type: 'student_teacher',
      })
      const learnerGroup = await Group.create({
        name: 'Learner Group',
        group_type: 'learner',
      })

      const course = await Course.create({
        name: 'Test Course',
        user_id: teacherUser.id,
        student_teacher_group_id: stGroup.group_id,
        learner_group_id: learnerGroup.group_id,
      })

      // Test student teacher course
      const foundST = await Group.findOne({
        where: { group_id: stGroup.group_id },
        include: [{ model: Course, as: 'studentTeacherCourses' }],
      })
      expect(foundST.studentTeacherCourses[0].id).toBe(course.id)

      // Test learner course
      const foundLearner = await Group.findOne({
        where: { group_id: learnerGroup.group_id },
        include: [{ model: Course, as: 'learnerCourses' }],
      })
      expect(foundLearner.learnerCourses[0].id).toBe(course.id)
    })
  })

  describe('Updates', () => {
    it('should update group name', async () => {
      const group = await Group.create({
        name: 'Old Name',
        group_type: 'learner',
      })
      await group.update({ name: 'New Name' })
      expect(group.name).toBe('New Name')
    })
  })

  describe('Cascade Delete', () => {
    it('should handle associations on delete', async () => {
      const group = await Group.create({
        name: 'Test Group',
        group_type: 'learner',
      })

      await group.destroy()
      const associatedCourses = await Course.count({
        where: { learner_group_id: group.group_id },
      })
      expect(associatedCourses).toBe(0)
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

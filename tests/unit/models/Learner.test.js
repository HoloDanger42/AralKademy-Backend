<<<<<<< HEAD
import { jest } from '@jest/globals'
import { User } from '../../../src/models/User.js'
import { Learner } from '../../../src/models/Learner.js'
import { Group } from '../../../src/models/Group.js'
import { Enrollment } from '../../../src/models/Enrollment.js'
import { sequelize } from '../../../src/config/database.js'
import {
  createTestUser,
  createTestGroup,
  createTestEnrollment,
  createTestSchool,
  createAdminDirectly,
} from '../../helpers/testData.js'
import '../../../src/models/associate.js'

jest.setTimeout(10000)

describe('Learner Model', () => {
  let enrollment
  let school
  let admin

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    admin = await createAdminDirectly(school)
    enrollment = await createTestEnrollment({
      school_id: school.school_id,
      handled_by_id: admin.id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid learner', async () => {
      const user = await createTestUser({
        email: `learner${Date.now()}@example.com`,
        role: 'learner',
      })

      const foundUser = await User.findByPk(user.id)
      expect(foundUser).toBeTruthy()
      expect(foundUser.role).toBe('learner')

      const learner = await Learner.create({
        user_id: foundUser.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      expect(learner).toHaveProperty('id')
      expect(learner.user_id).toBe(foundUser.id)
      expect(learner.year_level).toBe(3)
      expect(learner.enrollment_id).toBe(enrollment.enrollment_id)
    })

    it('should fail with invalid year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 7,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })

    it('should fail without enrollment_id', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 3,
        })
      ).rejects.toThrow('notNull Violation: Learner.enrollment_id cannot be null')
    })
  })

  describe('Associations', () => {
    it('should associate with enrollment', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      const found = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: Enrollment, as: 'enrollment' }],
      })

      expect(found.enrollment.enrollment_id).toBe(enrollment.enrollment_id)
    })

    it('should associate with user', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      const found = await Learner.findOne({
        where: { id: learner.id },
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      })
      expect(found.user.id).toBe(user.id)
    })

    it('should allow null group association', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      expect(learner.learner_group_id).toBeNull()
    })

    it('should associate with user through belongsTo', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,

        enrollment_id: enrollment.enrollment_id,
      })

      const foundLearner = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: User, as: 'user' }],
      })

      expect(foundLearner.user).toBeTruthy()
      expect(foundLearner.user.id).toBe(user.id)
    })

    it('should associate with group through belongsTo', async () => {
      const user = await createTestUser()
      const group = await createTestGroup()

      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        learner_group_id: group.group_id,
        enrollment_id: enrollment.enrollment_id,
      })

      const foundLearner = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: Group, as: 'group' }],
      })

      expect(foundLearner.group).toBeTruthy()
      expect(foundLearner.group.id).toBe(group.id)
    })

    it('should delete learner when user is deleted', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      // Force sync to ensure CASCADE is in place
      await sequelize.sync({ force: true })

      await user.destroy()
      const learnerCount = await Learner.count()
      expect(learnerCount).toBe(0)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 4,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should fail with zero year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 0,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })

    it('should fail with non-existent user_id', async () => {
      await expect(
        Learner.create({
          user_id: 99999,
          year_level: 3,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('foreign key constraint')
    })

    it('should fail with non-existent enrollment_id', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 3,
          enrollment_id: 99999,
        })
      ).rejects.toThrow('foreign key constraint')
    })
  })

  describe('Query Operations', () => {
    it('should find learner with associations', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      const found = await Learner.findByPk(learner.id, {
        include: ['user', 'enrollment', 'group'],
      })

      expect(found).toBeTruthy()
      expect(found.user.id).toBe(user.id)
      expect(found.enrollment_id).toBe(enrollment.enrollment_id)
    })
  })

  describe('Update Operations', () => {
    it('should update year level', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      await learner.update({ year_level: 4 })
      expect(learner.year_level).toBe(4)
    })
  })

  describe('Data Integrity', () => {
    it('should cascade delete when enrollment is deleted', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      await enrollment.destroy({ force: true })
      const learnerCount = await Learner.count()
      expect(learnerCount).toBe(0)
    })
  })
})
=======
import { jest } from '@jest/globals'
import { User } from '../../../src/models/User.js'
import { Learner } from '../../../src/models/Learner.js'
import { Group } from '../../../src/models/Group.js'
import { Enrollment } from '../../../src/models/Enrollment.js'
import { sequelize } from '../../../src/config/database.js'
import {
  createTestUser,
  createTestGroup,
  createTestEnrollment,
  createTestSchool,
  createAdminDirectly,
} from '../../helpers/testData.js'
import '../../../src/models/associate.js'

jest.setTimeout(10000)

describe('Learner Model', () => {
  let enrollment
  let school
  let admin

  beforeEach(async () => {
    await sequelize.sync({ force: true })
    school = await createTestSchool()
    admin = await createAdminDirectly(school)
    enrollment = await createTestEnrollment({
      school_id: school.school_id,
      handled_by_id: admin.id,
    })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid learner', async () => {
      const user = await createTestUser({
        email: `learner${Date.now()}@example.com`,
        role: 'learner',
      })

      const foundUser = await User.findByPk(user.id)
      expect(foundUser).toBeTruthy()
      expect(foundUser.role).toBe('learner')

      const learner = await Learner.create({
        user_id: foundUser.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      expect(learner).toHaveProperty('id')
      expect(learner.user_id).toBe(foundUser.id)
      expect(learner.year_level).toBe(3)
      expect(learner.enrollment_id).toBe(enrollment.enrollment_id)
    })

    it('should fail with invalid year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 7,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })

    it('should fail without enrollment_id', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 3,
        })
      ).rejects.toThrow('notNull Violation: Learner.enrollment_id cannot be null')
    })
  })

  describe('Associations', () => {
    it('should associate with enrollment', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      const found = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: Enrollment, as: 'enrollment' }],
      })

      expect(found.enrollment.enrollment_id).toBe(enrollment.enrollment_id)
    })

    it('should associate with user', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      const found = await Learner.findOne({
        where: { id: learner.id },
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      })
      expect(found.user.id).toBe(user.id)
    })

    it('should allow null group association', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      expect(learner.learner_group_id).toBeNull()
    })

    it('should associate with user through belongsTo', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,

        enrollment_id: enrollment.enrollment_id,
      })

      const foundLearner = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: User, as: 'user' }],
      })

      expect(foundLearner.user).toBeTruthy()
      expect(foundLearner.user.id).toBe(user.id)
    })

    it('should associate with group through belongsTo', async () => {
      const user = await createTestUser()
      const group = await createTestGroup()

      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        learner_group_id: group.group_id,
        enrollment_id: enrollment.enrollment_id,
      })

      const foundLearner = await Learner.findOne({
        where: { id: learner.id },
        include: [{ model: Group, as: 'group' }],
      })

      expect(foundLearner.group).toBeTruthy()
      expect(foundLearner.group.id).toBe(group.id)
    })

    it('should delete learner when user is deleted', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      // Force sync to ensure CASCADE is in place
      await sequelize.sync({ force: true })

      await user.destroy()
      const learnerCount = await Learner.count()
      expect(learnerCount).toBe(0)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique user_id', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 4,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow()
    })
  })

  describe('Validation', () => {
    it('should fail with zero year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 0,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })

    it('should fail with non-existent user_id', async () => {
      await expect(
        Learner.create({
          user_id: 99999,
          year_level: 3,
          enrollment_id: enrollment.enrollment_id,
        })
      ).rejects.toThrow('foreign key constraint')
    })

    it('should fail with non-existent enrollment_id', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 3,
          enrollment_id: 99999,
        })
      ).rejects.toThrow('foreign key constraint')
    })
  })

  describe('Query Operations', () => {
    it('should find learner with associations', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      const found = await Learner.findByPk(learner.id, {
        include: ['user', 'enrollment', 'group'],
      })

      expect(found).toBeTruthy()
      expect(found.user.id).toBe(user.id)
      expect(found.enrollment_id).toBe(enrollment.enrollment_id)
    })
  })

  describe('Update Operations', () => {
    it('should update year level', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      await learner.update({ year_level: 4 })
      expect(learner.year_level).toBe(4)
    })
  })

  describe('Data Integrity', () => {
    it('should cascade delete when enrollment is deleted', async () => {
      const user = await createTestUser()
      await Learner.create({
        user_id: user.id,
        year_level: 3,
        enrollment_id: enrollment.enrollment_id,
      })

      await enrollment.destroy({ force: true })
      const learnerCount = await Learner.count()
      expect(learnerCount).toBe(0)
    })
  })
})
>>>>>>> 627466f638de697919d077ca56524377d406840d

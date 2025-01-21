import { User } from '../../../src/models/User.js'
import { Learner } from '../../../src/models/Learner.js'
import { Group } from '../../../src/models/Group.js'
import { sequelize } from '../../../src/config/database.js'
import { createTestUser, createTestGroup } from '../../helpers/testData.js'
import models from '../../../src/models/associate.js'

describe('Learner Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
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
      })

      expect(learner).toHaveProperty('id')
      expect(learner.user_id).toBe(foundUser.id)
      expect(learner.year_level).toBe(3)
    })

    it('should fail with invalid year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 7,
        })
      ).rejects.toThrow('Year level must be between 1 and 6')
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      try {
        const user = await createTestUser()
        const learner = await Learner.create({
          user_id: user.id,
          year_level: 3,
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
      } catch (error) {
        console.log(error)
        throw error
      }
    })

    it('should allow null group association', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
      })
      expect(learner.learner_group_id).toBeNull()
    })

    it('should associate with user through belongsTo', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
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
      })

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
      })
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 4,
        })
      ).rejects.toThrow()
    })
  })
})

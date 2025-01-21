import { DataTypes } from 'sequelize'
import { sequelize } from '../../../src/config/database.js'
import { createTestUser, createTestGroup } from '../../helpers/testData.js'

// Define models for testing to avoid circular dependencies
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
  role: DataTypes.STRING,
})

const Group = sequelize.define('Group', {
  name: DataTypes.STRING,
  description: DataTypes.STRING,
})

const Learner = sequelize.define('Learner', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  year_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 6,
    },
  },
  learner_group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
})

// Set up associations
Learner.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Learner.belongsTo(Group, { foreignKey: 'learner_group_id', as: 'group' })

describe('Learner Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid learner', async () => {
      try {
        const user = await createTestUser()
        const learner = await Learner.create({
          user_id: user.user_id,
          year_level: 3,
        })
        expect(learner).toHaveProperty('id')
        expect(learner.year_level).toBe(3)
      } catch (error) {
        console.error(error)
        throw error
      }
    })

    it('should fail with invalid year level', async () => {
      const user = await createTestUser()
      await expect(
        Learner.create({
          user_id: user.id,
          year_level: 7,
        })
      ).rejects.toThrow()
    })
  })

  describe('Associations', () => {
    it('should associate with user', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
      })
      const found = await Learner.findOne({
        where: { id: learner.id },
        include: ['user'],
      })
      expect(found.user.id).toBe(user.id)
    })

    it('should allow null group association', async () => {
      const user = await createTestUser()
      const learner = await Learner.create({
        user_id: user.id,
        year_level: 3,
      })
      expect(learner.learner_group_id).toBeNull()
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

import { sequelize } from '../../../src/config/database.js'
import { User } from '../../../src/models/User.js'
import { validUsers, invalidUsers } from '../../fixtures/userData.js'

describe('User Model', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  // Test valid user creations
  validUsers.forEach(({ username, email, password }) => {
    test(`should create a user successfully: ${username}`, async () => {
      const user = await User.create({ username, email, password })

      expect(user).toHaveProperty('id')
      expect(user.username).toBe(username)
      expect(user.email).toBe(email)
    })
  })

  // Test invalid user creations
  invalidUsers.forEach((userData) => {
    test(`should fail to create a user with data: ${JSON.stringify(userData)}`, async () => {
      await expect(User.create(userData)).rejects.toThrow()
    })
  })

  // Test duplicate email creation
  describe('Duplicate Email', () => {
    test('should fail to create a user with a duplicate email', async () => {
      await User.create({
        username: 'unique_user',
        email: 'unique@example.com',
        password: 'password123',
      })

      await expect(
        User.create({
          username: 'another_user',
          email: 'unique@example.com',
          password: 'password456',
        })
      ).rejects.toThrow('Email already exists')
    })
  })

  afterEach(async () => {
    await User.destroy({ where: {} })
  })
})

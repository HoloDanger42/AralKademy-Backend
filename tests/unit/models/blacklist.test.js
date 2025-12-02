import { sequelize } from '../../../src/config/database.js'
import { Blacklist } from '../../../src/models/index.js'

describe('Blacklist Model', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })
  })

  afterAll(async () => {
    await sequelize.close()
  })

  describe('Creation', () => {
    it('should create a valid blacklist', async () => {
      const blacklist = await Blacklist.create({
        token: 'testtoken',
        expiresAt: new Date(),
      })

      expect(blacklist).toHaveProperty('id')
      expect(blacklist.token).toBe('testtoken')
    })

    it('should fail without required fields', async () => {
      await expect(Blacklist.create({})).rejects.toThrow()
    })
  })
})

import { cleanupExpiredTokens } from '../../../src/utils/tokenCleanup.js'
import { Blacklist } from '../../../src/models/index.js'
import { sequelize } from '../../../src/config/database.js'

describe('Token Cleanup', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true })

    // Create some test tokens
    await Blacklist.bulkCreate([
      {
        token: 'expired-token-1',
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
      },
      {
        token: 'expired-token-2',
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      },
    ])
  })

  afterAll(async () => {
    await sequelize.close()
  })

  it('should remove only expired tokens', async () => {
    // Run cleanup
    const deletedCount = await cleanupExpiredTokens()

    // Check that 2 tokens were deleted (the expired ones)
    expect(deletedCount).toBe(2)

    // Verify only the valid token remains
    const remainingTokens = await Blacklist.findAll()
    expect(remainingTokens.length).toBe(1)
    expect(remainingTokens[0].token).toBe('valid-token')
  })
})

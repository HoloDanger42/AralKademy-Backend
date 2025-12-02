import { jest } from '@jest/globals'
import TokenCleanup from '../../../src/utils/tokenCleanup.js'
import { Blacklist } from '../../../src/models/index.js'
import { sequelize } from '../../../src/config/database.js'
import { log } from '../../../src/utils/logger.js'

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

  describe('cleanupExpiredTokens', () => {
    it('should remove only expired tokens', async () => {
      // Run cleanup
      const deletedCount = await TokenCleanup.cleanupExpiredTokens()

      // Check that 2 tokens were deleted (the expired ones)
      expect(deletedCount).toBe(2)

      // Verify only the valid token remains
      const remainingTokens = await Blacklist.findAll()
      expect(remainingTokens.length).toBe(1)
      expect(remainingTokens[0].token).toBe('valid-token')
    })

    it('should log and throw an error when database operation fails', async () => {
      // Mock Blacklist.destroy to throw an error
      const mockError = new Error('Database connection error')
      const originalDestroy = Blacklist.destroy
      Blacklist.destroy = jest.fn().mockRejectedValue(mockError)

      // Mock the logger
      const originalLogError = log.error
      log.error = jest.fn()

      // Act & Assert - ensure the error is thrown
      await expect(TokenCleanup.cleanupExpiredTokens()).rejects.toThrow('Database connection error')

      // Verify the error was logged
      expect(Blacklist.destroy).toHaveBeenCalled()
      expect(log.error).toHaveBeenCalledWith('Token cleanup error:', mockError)

      // Restore original implementations
      Blacklist.destroy = originalDestroy
      log.error = originalLogError
    })
  })

  describe('scheduleTokenCleanup', () => {
    let originalSetInterval
    let mockSetInterval
    let originalCleanupMethod

    // Use fake timers for testing scheduled intervals
    beforeEach(() => {
      jest.useFakeTimers()

      // Save original implementation
      originalSetInterval = global.setInterval
      originalCleanupMethod = TokenCleanup.cleanupExpiredTokens

      // Create a mock for cleanupExpiredTokens
      const mockCleanup = jest.fn().mockResolvedValue(0)
      TokenCleanup.cleanupExpiredTokens = mockCleanup

      // Mock setInterval to capture calls
      mockSetInterval = jest.fn().mockImplementation((fn, interval) => {
        // Return a fake timer ID
        return 12345
      })
      global.setInterval = mockSetInterval
    })

    afterEach(() => {
      jest.useRealTimers()
      global.setInterval = originalSetInterval
      TokenCleanup.cleanupExpiredTokens = originalCleanupMethod
    })

    it('should schedule token cleanup immediately and periodically', () => {
      const intervalId = TokenCleanup.scheduleTokenCleanup(1)

      // Verify immediate execution
      expect(TokenCleanup.cleanupExpiredTokens).toHaveBeenCalledTimes(1)

      // Verify interval was set with correct parameters
      expect(mockSetInterval).toHaveBeenCalledWith(
        TokenCleanup.cleanupExpiredTokens, // Now it's the mocked method of the class
        60000 // 1 minute in milliseconds
      )

      expect(intervalId).toBeDefined()
    })

    it('should return a valid interval id', () => {
      const intervalId = TokenCleanup.scheduleTokenCleanup(60)
      expect(intervalId).toBeDefined()
    })
  })
})

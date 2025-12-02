<<<<<<< HEAD
import { Blacklist } from '../models/index.js'
import { Op } from 'sequelize'
import { log } from './logger.js'

class TokenCleanup {
  /**
   * Removes expired tokens from the blacklist table
   * @returns {Promise<number>} Number of records deleted
   */
  static async cleanupExpiredTokens() {
    try {
      const now = new Date()
      const result = await Blacklist.destroy({
        where: {
          expiresAt: {
            [Op.lt]: now,
          },
        },
      })

      log.info(`Cleaned up ${result} expired tokens from the blacklist`)
      return result
    } catch (error) {
      log.error('Token cleanup error:', error)
      throw error
    }
  }

  /**
   * Schedules periodic cleanup of expired tokens
   * @param {number} intervalMinutes - How often to run cleanup (default: 60 minutes)
   * @returns {NodeJS.Timeout} Interval ID for cleanup task
   */
  static scheduleTokenCleanup(intervalMinutes = 60) {
    // Run cleanup immediately on start
    this.cleanupExpiredTokens()

    // Then schedule to run periodically
    const interval = intervalMinutes * 60 * 1000 // Convert to milliseconds
    const intervalId = setInterval(this.cleanupExpiredTokens, interval)

    log.info(`Token cleanup scheduled to run every ${intervalMinutes} minutes`)
    return intervalId
  }
}

export default TokenCleanup
=======
import { Blacklist } from '../models/index.js'
import { Op } from 'sequelize'
import { log } from './logger.js'

class TokenCleanup {
  /**
   * Removes expired tokens from the blacklist table
   * @returns {Promise<number>} Number of records deleted
   */
  static async cleanupExpiredTokens() {
    try {
      const now = new Date()
      const result = await Blacklist.destroy({
        where: {
          expiresAt: {
            [Op.lt]: now,
          },
        },
      })

      log.info(`Cleaned up ${result} expired tokens from the blacklist`)
      return result
    } catch (error) {
      log.error('Token cleanup error:', error)
      throw error
    }
  }

  /**
   * Schedules periodic cleanup of expired tokens
   * @param {number} intervalMinutes - How often to run cleanup (default: 60 minutes)
   * @returns {NodeJS.Timeout} Interval ID for cleanup task
   */
  static scheduleTokenCleanup(intervalMinutes = 60) {
    // Run cleanup immediately on start
    this.cleanupExpiredTokens()

    // Then schedule to run periodically
    const interval = intervalMinutes * 60 * 1000 // Convert to milliseconds
    const intervalId = setInterval(this.cleanupExpiredTokens, interval)

    log.info(`Token cleanup scheduled to run every ${intervalMinutes} minutes`)
    return intervalId
  }
}

export default TokenCleanup
>>>>>>> 627466f638de697919d077ca56524377d406840d

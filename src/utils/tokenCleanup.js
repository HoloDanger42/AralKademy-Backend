import { Blacklist } from '../models/index.js'
import { Op } from 'sequelize'
import { log } from './logger.js'

/**
 * Removes expired tokens from the blacklist table
 * @returns {Promise<number>} Number of records deleted
 */
export const cleanupExpiredTokens = async () => {
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
export const scheduleTokenCleanup = (intervalMinutes = 60) => {
  // Run cleanup immediately on start
  cleanupExpiredTokens()

  // Then schedule to run periodically
  const interval = intervalMinutes * 60 * 1000 // Convert to milliseconds
  const intervalId = setInterval(cleanupExpiredTokens, interval)

  log.info(`Token cleanup scheduled to run every ${intervalMinutes} minutes`)
  return intervalId
}

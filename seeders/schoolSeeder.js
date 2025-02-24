import { sequelize } from '../src/config/database.js'
import { School } from '../src/models/School.js'
import { schoolsList } from '../src/config/schools.js'
import { log } from '../src/utils/logger.js'

export const seedSchools = async () => {
  const t = await sequelize.transaction()
  try {
    // Check if schools already exist
    const existingSchools = await School.count()
    if (existingSchools > 0) {
      log.info('Schools already seeded')
      return
    }

    // Create schools from configuration
    await School.bulkCreate(schoolsList, {
      validate: true,
      individualHooks: true,
      transaction: t,
    })
    await t.commit()

    log.info('Schools seeded successfully')
  } catch (error) {
    await t.rollback()
    log.error('School seeding error:', error)
    throw error
  }
}

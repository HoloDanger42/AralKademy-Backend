import { seedSchools } from './schoolSeeder.js'
import { seedAdmins } from './adminSeeder.js'
import { log } from '../src/utils/logger.js'

export const runSeeders = async () => {
  try {
    log.info('Starting database seeding...')

    await seedSchools()
    await seedAdmins()

    log.info('All seeders completed successfully')
  } catch (error) {
    log.error('Seeder error:', error)
    throw error
  }
}

// Only exit if this file is being run directly via node or npm run seed
const isDirectExecution = process.argv[1] && process.argv[1].includes('seeders/index.js')

if (isDirectExecution) {
  runSeeders()
    .catch(console.error)
    .finally(() => process.exit())
}

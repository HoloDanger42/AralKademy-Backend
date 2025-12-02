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
if (import.meta.url === import.meta.resolve('./index.js')) {
  runSeeders()
    .catch(console.error)
    .finally(() => process.exit())
}

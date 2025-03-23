import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import { log } from '../utils/logger.js'

dotenv.config()

let sequelize

// Check if DB_HOST is a connection URL (starts with postgres:// or postgresql://)
if (
  process.env.DB_HOST &&
  (process.env.DB_HOST.startsWith('postgres://') || process.env.DB_HOST.startsWith('postgresql://'))
) {
  // Use the connection URL directly
  sequelize = new Sequelize(process.env.DB_HOST, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  })
  log.info('Using connection string for database connection')
} else {
  // Use individual connection parameters
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'test' ? false : console.log,
  })
  log.info('Using individual parameters for database connection')
}

const databaseConnection = async () => {
  try {
    await sequelize.authenticate()
    log.info('Database connection has been established successfully.')

    // Import models and associations dynamically to avoid circular dependencies
    const {
      User,
      Teacher,
      Admin,
      StudentTeacher,
      Learner,
      Enrollment,
      Course,
      Group,
      School,
      Module,
      Content,
    } = await import('../models/index.js')

    // Import associations after models are loaded
    await import('../models/associate.js')

    await sequelize.sync({ force: false })
    log.info('Database synchronized successfully.')

    return {
      User,
      Teacher,
      Admin,
      StudentTeacher,
      Learner,
      Enrollment,
      Course,
      Group,
      School,
      Module,
      Content,
    }
  } catch (error) {
    log.error('Database connection failed:', error)
    throw error
  }
}

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    if (process.env.RUN_SEEDERS === 'true') {
      const { runSeeders } = await import('../../seeders/index.js')
      await runSeeders()
    }

    log.info('Database initialized successfully')
  } catch (error) {
    log.error('Database initialization error:', error)
    throw error
  }
}

export { sequelize, databaseConnection }

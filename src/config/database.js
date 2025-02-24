import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import { log } from '../utils/logger.js'
import { runSeeders } from '../../seeders/index.js'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'test' ? false : console.log,
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  dbConfig
)

const databaseConnection = async () => {
  try {
    await sequelize.authenticate()
    log.info('Database connection has been established successfully.')

    await import('../models/associate.js')

    await sequelize.sync({ force: false })

    log.info('Database synchronized successfully.')
  } catch (error) {
    log.error('Database connection failed:', error)
    throw error
  }
}

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: true })

    if (process.env.NODE_ENV === 'development') {
      await runSeeders()
    }

    log.info('Database initialized successfully')
  } catch (error) {
    log.error('Database initialization error:', error)
    throw error
  }
}

export { sequelize, databaseConnection }

import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import { log } from '../utils/logger.js'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'test' ? false : console.log,
}

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  dbConfig
)

const databaseConnection = async () => {
  try {
    await sequelize.authenticate()
    log.info('Database connection has been established successfully.')

    // Import models and associations dynamically to avoid circular dependencies
    const { User, Teacher, Admin, StudentTeacher, Learner, Enrollment, Course, Group, School, Module } =
      await import('../models/index.js')

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
      Module
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

export { databaseConnection }

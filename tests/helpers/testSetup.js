import { sequelize } from '../../src/config/database.js'
import { clearUsers, clearCourses } from './testData.js'
import { createTestUser, createTestCourse } from './testData.js'

/**
 * Sets up the test environment before running tests.
 */
export const setupTestEnvironment = async () => {
  try {
    await sequelize.sync({ force: true })
    await createTestUser()
    await createTestCourse()
  } catch (error) {
    console.error('Test setup failed:', error)
    throw error
  }
}

/**
 * Tears down the test environment after tests have run.
 */
export const teardownTestEnvironment = async () => {
  try {
    const tables = await sequelize.getQueryInterface().showAllTables()

    if (tables.includes('courses')) await clearCourses()
    if (tables.includes('users')) {
      await sequelize.query('TRUNCATE TABLE users CASCADE')
      await clearUsers()
    }
    await sequelize.close()
  } catch (error) {
    console.error('Test teardown failed:', error)
    if (!error.original || error.original.code !== '42P01') {
      throw error
    }
  }
}

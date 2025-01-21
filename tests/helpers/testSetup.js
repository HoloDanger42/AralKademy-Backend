import { sequelize } from '../../src/config/database.js'
import { clearUsers, clearCourses, createTestSchool } from './testData.js'
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
    await sequelize.query('TRUNCATE TABLE users CASCADE')
    await clearUsers()
    await clearCourses()
    await sequelize.close()
  } catch (error) {
    console.error('Test teardown failed:', error)
    throw error
  }
}

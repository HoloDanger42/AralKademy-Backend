import { sequelize } from '../../src/config/database.js'
import { clearUsers, clearCourses, createTestSchool } from './testData.js'
import { createTestUser, createTestCourse } from './testData.js'

/**
 * Sets up the test environment before running tests.
 */
export const setupTestEnvironment = async () => {
  await sequelize.sync({ force: true })
  await createTestUser()
  await createTestCourse()
}

/**
 * Tears down the test environment after tests have run.
 */
export const teardownTestEnvironment = async () => {
  await clearUsers()
  await clearCourses()
  await sequelize.close()
}

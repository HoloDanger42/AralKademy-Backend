import { Sequelize } from 'sequelize'
import { sequelize, databaseConnection } from '../../../src/config/database.js'
import { log } from '../../../src/utils/logger.js'
import { jest } from '@jest/globals'
import dotenv from 'dotenv'

dotenv.config()

describe('Database Configuration', () => {
  let infoSpy
  let errorSpy
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    infoSpy = jest.spyOn(log, 'info').mockImplementation(() => {})
    errorSpy = jest.spyOn(log, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('should create Sequelize instance with correct config', () => {
    expect(sequelize).toBeInstanceOf(Sequelize)
    expect(sequelize.config.host).toEqual(process.env.DB_HOST)
    expect(sequelize.config.database).toEqual(process.env.DB_NAME)
    expect(sequelize.config.username).toEqual(process.env.DB_USER)
    expect(sequelize.config.password).toEqual(process.env.DB_PASSWORD)
  })

  it('should establish database connection successfully', async () => {
    const authenticateSpy = jest.spyOn(sequelize, 'authenticate')
    const syncSpy = jest.spyOn(sequelize, 'sync')

    authenticateSpy.mockResolvedValue()
    syncSpy.mockResolvedValue()

    await databaseConnection()

    expect(authenticateSpy).toHaveBeenCalled()
    expect(syncSpy).toHaveBeenCalledWith({ force: false })
    expect(log.info).toHaveBeenCalledWith('Database connection has been established successfully.')
    expect(log.info).toHaveBeenCalledWith('Database synchronized successfully.')

    authenticateSpy.mockRestore()
    syncSpy.mockRestore()
  })

  it('should handle connection failure', async () => {
    const authenticateSpy = jest.spyOn(sequelize, 'authenticate')
    const error = new Error('Connection failed')
    authenticateSpy.mockRejectedValue(error)

    await expect(databaseConnection()).rejects.toThrow('Connection failed')
    expect(log.error).toHaveBeenCalledWith('Database connection failed.', error)

    authenticateSpy.mockRestore()
  })

  it('should handle sync failure', async () => {
    const authenticateSpy = jest.spyOn(sequelize, 'authenticate')
    const syncSpy = jest.spyOn(sequelize, 'sync')

    authenticateSpy.mockResolvedValue()
    const error = new Error('Sync failed')
    syncSpy.mockRejectedValue(error)

    await expect(databaseConnection()).rejects.toThrow('Sync failed')
    expect(log.error).toHaveBeenCalledWith('Database connection failed.', error)

    authenticateSpy.mockRestore()
    syncSpy.mockRestore()
  })

  describe('Environment Configuration', () => {
    it('should validate required environment variables', () => {
      // Clear env vars
      delete process.env.DB_NAME
      delete process.env.DB_USER

      expect(
        () =>
          new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, dbConfig)
      ).toThrow()

      process.env = originalEnv
    })
  })

  describe('Connection Timeout', () => {
    it('should handle connection timeout', async () => {
      const authenticateSpy = jest.spyOn(sequelize, 'authenticate')
      authenticateSpy.mockRejectedValue(new Error('Connection timeout'))

      await expect(databaseConnection()).rejects.toThrow('Connection timeout')

      authenticateSpy.mockRestore()
    })
  })
})

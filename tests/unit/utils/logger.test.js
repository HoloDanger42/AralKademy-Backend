import { log } from '../../../src/utils/logger.js'
import { jest } from '@jest/globals'

describe('Logger', () => {
  beforeAll(() => {
    // Mock transports to prevent actual logging
    log.transports.forEach((transport) => {
      jest.spyOn(transport, 'log').mockImplementation((_info, callback) => {
        if (callback) callback()
      })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log info messages', () => {
    const message = 'This is an info message'
    log.info(message)

    log.transports.forEach((transport) => {
      expect(transport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: message,
          timestamp: expect.any(String),
        }),
        expect.any(Function)
      )
    })
  })

  it('should log error messages', () => {
    const message = 'This is an error message'
    log.error(message)

    log.transports.forEach((transport) => {
      expect(transport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: message,
          timestamp: expect.any(String),
        }),
        expect.any(Function)
      )
    })
  })

  it('should include additional metadata', () => {
    const message = 'User logged in'
    const metadata = { userId: '12345', role: 'admin' }
    log.info(message, metadata)

    log.transports.forEach((transport) => {
      expect(transport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: message,
          timestamp: expect.any(String),
          ...metadata,
        }),
        expect.any(Function)
      )
    })
  })
})

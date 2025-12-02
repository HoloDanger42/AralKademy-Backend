import request from 'supertest'
import express from 'express'
import { logMiddleware } from '../../../src/middleware/logMiddleware.js'
import { log } from '../../../src/utils/logger.js'
import { beforeEach, afterEach, describe, it, expect, jest } from '@jest/globals'

describe('Log Middleware', () => {
  let app

  beforeEach(() => {
    app = express()
    app.use(express.json())
    app.use(logMiddleware)
    app.get('/test', (_req, res) => res.json({ message: 'Test Route' }))
    app.post('/test', (req, res) => res.json({ received: req.body }))
    jest.spyOn(log, 'info')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log incoming GET requests', async () => {
    const res = await request(app).get('/test').set('x-forwarded-for', '1.2.3.4')

    expect(res.status).toBe(200)
    expect(log.info).toHaveBeenCalledWith(
      'Request: GET /test',
      expect.objectContaining({
        timestamp: expect.any(String),
        headers: expect.objectContaining({
          'x-forwarded-for': '1.2.3.4',
        }),
        body: {},
      })
    )
    expect(log.info).toHaveBeenCalledWith(
      'Response: 200',
      expect.objectContaining({
        timestamp: expect.any(String),
        body: JSON.stringify({ message: 'Test Route' }),
        duration: expect.stringMatching(/\d+ms/),
      })
    )
  })

  it('should log incoming POST requests with body', async () => {
    const payload = { username: 'testuser', password: 'password123' }
    const res = await request(app).post('/test').send(payload)

    expect(res.status).toBe(200)
    expect(log.info).toHaveBeenCalledWith(
      'Request: POST /test',
      expect.objectContaining({
        timestamp: expect.any(String),
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
        body: payload,
      })
    )
    expect(log.info).toHaveBeenCalledWith(
      'Response: 200',
      expect.objectContaining({
        timestamp: expect.any(String),
        body: JSON.stringify({ received: payload }),
        duration: expect.stringMatching(/\d+ms/),
      })
    )
  })

  it('should handle responses correctly', async () => {
    const res = await request(app).get('/test')

    expect(res.body).toEqual({ message: 'Test Route' })
    expect(log.info).toHaveBeenCalledTimes(2)
  })
})

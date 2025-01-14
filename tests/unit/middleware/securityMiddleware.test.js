import request from 'supertest'
import express from 'express'
import { securityMiddleware, authLimiter } from '../../../src/middleware/securityMiddleware.js'
import { beforeEach, expect } from '@jest/globals'

describe('Security Middleware', () => {
  let app

  beforeEach(() => {
    app = express()
    app.set('trust proxy', 1)
    app.use(securityMiddleware)
    app.post('/auth', authLimiter, (_req, res) =>
      res.json({ message: 'Authentication Successful' })
    )
  })

  describe('CORS', () => {
    it('should allow requests from allowed origins', async () => {
      const res = await request(app).get('/test').set('Origin', 'http://localhost:3000')

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
      expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    it('should block requests from unauthorized origins', async () => {
      const res = await request(app).get('/test').set('Origin', 'http://evil.com')

      expect(res.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('Helmet', () => {
    it('should set security headers', async () => {
      const res = await request(app).get('/test')

      expect(res.headers['x-frame-options']).toBe('DENY')
      expect(res.headers['x-content-type-options']).toBe('nosniff')
      expect(res.headers['x-xss-protection']).toBe('0')
      expect(res.headers['strict-transport-security']).toBeDefined()
    })
  })

  describe('Rate Limiting', () => {
    it('should limit standard requests', async () => {
      const requests = Array(101)
        .fill()
        .map(() => request(app).get('/test').set('x-forwarded-for', '1.2.3.4'))
      const responses = await Promise.all(requests)

      expect(responses[100].status).toBe(429)
      expect(responses[100].body.message).toBe('Too many requests from this IP')
    })

    it('should apply stricter limits to auth endpoints', async () => {
      const app = express()
      app.set('trust proxy', 1)
      app.post('/auth', authLimiter, (_req, res) =>
        res.json({ message: 'Authentication Successful' })
      )

      const requests = Array(6)
        .fill()
        .map(() => request(app).post('/auth').set('x-forwarded-for', '1.2.3.4'))
      const responses = await Promise.all(requests)

      expect(responses[5].status).toBe(429)
      expect(responses[5].body.message).toBe('Too many authentication requests')
    })
  })

  describe('XSS Protection', () => {
    it('should sanitize input with potential XSS', async () => {
      const res = await request(app).post('/test').send({ input: '<script>alert("xss")</script>' })

      expect(res.text).not.toContain('<script>')
    })
  })

  describe('MongoDB Sanitization', () => {
    it('should remove MongoDB operators from request', async () => {
      const res = await request(app)
        .post('/test')
        .send({ field: { $gt: '' } })

      expect(res.body.field).toBeUndefined()
    })
  })
})

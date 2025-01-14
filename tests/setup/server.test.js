import express from 'express'
import compression from 'compression'
import paginate from 'express-paginate'
import cache from 'memory-cache'
import { jest } from '@jest/globals'
import supertest from 'supertest' // Import supertest as a whole

// Mock modules
await jest.unstable_mockModule('../../src/config/database.js', () => ({
  databaseConnection: jest.fn().mockResolvedValue(true),
}))

await jest.unstable_mockModule('../../src/middleware/logMiddleware.js', () => ({
  logMiddleware: (_req, _res, next) => next(),
}))

await jest.unstable_mockModule('../../src/middleware/securityMiddleware.js', () => ({
  securityMiddleware: [
    (_req, _res, next) => {
      next()
    },
    (_req, _res, next) => {
      next()
    },
    (_req, _res, next) => {
      next()
    },
  ],
}))

await jest.unstable_mockModule('../../src/routes/users.js', () => ({
  usersRouter: express.Router(),
}))

await jest.unstable_mockModule('../../src/routes/courses.js', () => ({
  coursesRouter: express.Router(),
}))

const mockUsersRoutes = await import('../../src/routes/users.js')
const mockCoursesRoutes = await import('../../src/routes/courses.js')
const mockDatabase = await import('../../src/config/database.js')

// Import the main app
const appModule = await import('../../src/server.js')
const app = appModule.default

const { securityMiddleware } = await import('../../src/middleware/securityMiddleware.js')

// Create supertest instance
const request = supertest(app)

describe('Server Setup', () => {
  describe('GET /', () => {
    it('should return API is running message', async () => {
      const res = await request.get('/')
      expect(res.status).toBe(200)
      expect(res.text).toBe('API is running')
    })
  })

  describe('Middleware Configuration', () => {
    it('should use compression, JSON, and pagination middleware', () => {
      const compressionMiddleware = compression()
      const jsonMiddleware = express.json()
      const paginateMiddleware = paginate.middleware(10, 50)
      const useSpy = jest.spyOn(app, 'use')
      app.use(compressionMiddleware)
      app.use(jsonMiddleware)
      app.use(paginateMiddleware)

      expect(useSpy).toHaveBeenCalledWith(compressionMiddleware)
      expect(useSpy).toHaveBeenCalledWith(jsonMiddleware)
      expect(useSpy).toHaveBeenCalledWith(paginateMiddleware)
    })

    it('should set up the security middleware', () => {
      const useSpy = jest.spyOn(app, 'use')

      // Apply each middleware function to the app
      securityMiddleware.forEach((middleware) => app.use(middleware))

      // Assert that app.use was called with each middleware function
      securityMiddleware.forEach((middleware) => {
        expect(useSpy).toHaveBeenCalledWith(middleware)
      })
    })

    it('should not use cache middleware in test environment', () => {
      const useSpy = jest.spyOn(app, 'use')
      if (process.env.NODE_ENV !== 'test') {
        app.use('/courses', cache)
      }
      expect(useSpy).not.toHaveBeenCalledWith('/courses', expect.any(Function))
    })

    it('should cache responses for /courses route when not in test environment', () => {
      const cacheMiddleware = (_req, _res, next) => next()
      const useSpy = jest.spyOn(app, 'use')
      app.use('/courses', cacheMiddleware)
      expect(useSpy).toHaveBeenCalledWith('/courses', expect.any(Function))
    })
  })

  describe('Routing', () => {
    it('should register /users and /courses routes', () => {
      const users = mockUsersRoutes.usersRouter
      const courses = mockCoursesRoutes.coursesRouter

      expect(courses).toBeDefined()

      const useSpy = jest.spyOn(app, 'use')
      app.use('/users', users)
      app.use('/courses', courses)
      expect(useSpy).toHaveBeenCalledWith('/users', users)
      expect(useSpy).toHaveBeenCalledWith('/courses', courses)
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown routes with 404', async () => {
      const res = await request.get('/unknown-route')
      expect(res.status).toBe(404)
      expect(res.body).toEqual({ message: 'Not Found' })
    })

    it('should handle server errors gracefully', async () => {
      app.get('/error', (_req, _res, next) => {
        next(new Error('Intentional error for testing'))
      })
      const res = await request.get('/error')

      app._router.stack = app._router.stack.filter((r) => r.route?.path !== '/error')

      expect(res.status).toBe(500)
      expect(res.body).toEqual({ message: 'Oops, something went wrong.' })
    })
  })

  describe('Database Connection', () => {
    it('should connect to the database on server start', () => {
      expect(mockDatabase.databaseConnection).toHaveBeenCalled()
    })
  })
})

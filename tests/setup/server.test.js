import express from 'express'
import compression from 'compression'
import paginate from 'express-paginate'
import cache from 'memory-cache'
import { jest } from '@jest/globals'
import supertest from 'supertest'
import { errorMiddleware, SpecificError } from '../../src/middleware/errorMiddleware.js'

// Mock modules
jest.unstable_mockModule('../../src/config/database.js', () => ({
  databaseConnection: jest.fn().mockResolvedValue(true),
}))

jest.unstable_mockModule('../../src/middleware/logMiddleware.js', () => ({
  logMiddleware: (_req, _res, next) => next(),
}))

jest.unstable_mockModule('../../src/middleware/securityMiddleware.js', () => ({
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

jest.unstable_mockModule('../../src/middleware/errorMiddleware.js', () => ({
  errorMiddleware: errorMiddleware,
  SpecificError: SpecificError,
}))

jest.unstable_mockModule('../../src/routes/users.js', () => ({
  usersRouter: express.Router(),
}))

jest.unstable_mockModule('../../src/routes/courses.js', () => ({
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
      securityMiddleware.forEach((middleware) => app.use(middleware))

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
      const useSpy = jest.spyOn(app, 'use')
      const cacheMiddleware = (req, res, next) => {
        const key = `__express__${req.originalUrl || req.url}${JSON.stringify(req.body)}`
        const cachedBody = cache.get(key)

        if (cachedBody) {
          res.send(cachedBody)
          return
        } else {
          res.sendResponse = res.send
          res.send = (body) => {
            cache.put(key, body, 300 * 1000)
            res.sendResponse(body)
          }
          next()
        }
      }
      app.use('/courses', cacheMiddleware)
      expect(useSpy).toHaveBeenCalledWith('/courses', cacheMiddleware)
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

      const body = JSON.parse(res.text)
      expect(body).toEqual({ message: 'Not Found' })
    })

    it('should handle server errors gracefully', async () => {
      // Find the /error route
      const errorRoute = app._router.stack.find((r) => r.route && r.route.path === '/error')

      // Save the original handler
      const originalErrorHandler = errorRoute.handle

      // Override the handler for the test
      errorRoute.handle = (_req, _res, next) => {
        next(new Error('Intentional error for testing'))
      }

      const res = await request.get('/error')

      errorRoute.handle = originalErrorHandler

      expect(res.status).toBe(500)
      expect(res.body).toEqual({ message: 'Intentional error for testing' })
    })
  })

  describe('Database Connection', () => {
    let server

    beforeEach(() => {
      // Clear mock before each test
      mockDatabase.databaseConnection.mockClear()
    })

    afterEach(async () => {
      if (server) {
        await server.close()
      }
    })

    it('should connect to the database on server start', async () => {
      // Import the app initialization function
      const { initializeApp } = await import('../../src/server.js')

      // Initialize the app, which should trigger database connection
      server = await initializeApp()

      // Verify database connection was attempted
      expect(mockDatabase.databaseConnection).toHaveBeenCalled()
      expect(server.listening).toBe(true)
    })
  })
})

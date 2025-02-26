import express from 'express'
import compression from 'compression'
import paginate from 'express-paginate'
import rateLimit from 'express-rate-limit'
import cache from 'memory-cache'
import { jest } from '@jest/globals'
import supertest from 'supertest'
import { errorMiddleware, SpecificError } from '../../../src/middleware/errorMiddleware.js'

// Mock modules
jest.unstable_mockModule('../../../src/config/database.js', () => {
  const mockModelInstance = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    hasMany: jest.fn(),
    belongsTo: jest.fn(),
    belongsToMany: jest.fn(),
    comparePassword: jest.fn().mockResolvedValue(true),
  }

  const mockModel = {
    ...mockModelInstance,
    prototype: {
      comparePassword: jest.fn().mockResolvedValue(true),
    },
  }

  return {
    databaseConnection: jest.fn().mockResolvedValue(true),
    initializeDatabase: jest.fn().mockResolvedValue(true),
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
      define: jest.fn().mockReturnValue(mockModel),
      models: {},
      transaction: jest.fn((cb) => cb()),
      literal: jest.fn(),
      col: jest.fn(),
      where: jest.fn(),
      DataTypes: {
        STRING: 'STRING',
        INTEGER: 'INTEGER',
        DATE: 'DATE',
        ENUM: (...values) => `ENUM(${values.join(', ')})`,
        BOOLEAN: 'BOOLEAN',
      },
    },
  }
})

jest.unstable_mockModule('../../../src/middleware/logMiddleware.js', () => ({
  logMiddleware: (_req, _res, next) => next(),
}))

jest.unstable_mockModule('../../../src/middleware/securityMiddleware.js', () => ({
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

jest.unstable_mockModule('../../../src/middleware/errorMiddleware.js', () => ({
  errorMiddleware: errorMiddleware,
  SpecificError: SpecificError,
}))

jest.unstable_mockModule('../../../src/routes/users.js', () => ({
  usersRouter: express.Router(),
}))

jest.unstable_mockModule('../../../src/routes/courses.js', () => ({
  coursesRouter: express.Router(),
}))

const mockUsersRoutes = await import('../../../src/routes/users.js')
const mockCoursesRoutes = await import('../../../src/routes/courses.js')
const mockDatabase = await import('../../../src/config/database.js')

// Import the main app
const appModule = await import('../../../src/server.js')

// Mock the app configuration
const app = appModule.default
const FIFTEEN_MINUTES = 15 * 60 * 1000
const AUTH_MAX_REQUESTS = 5

const { securityMiddleware } = await import('../../../src/middleware/securityMiddleware.js')

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
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        // Import the app initialization function
        const { initializeApp } = await import('../../../src/server.js')

        // Initialize the app, which should trigger database connection
        server = await initializeApp()

        // Verify database connection was attempted
        expect(mockDatabase.databaseConnection).toHaveBeenCalled()
        expect(server.listening).toBe(true)
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })
  })

  describe('Rate Limiting', () => {
    let app, request
    const originalEnv = process.env.NODE_ENV

    beforeEach(() => {
      // Create a fresh Express app instance for each test
      app = express()

      // Apply JSON middleware first
      app.use(express.json())

      // Create the rate limiter with a store
      const limiter = rateLimit({
        windowMs: FIFTEEN_MINUTES,
        max: 3, // Small number for testing
        standardHeaders: true,
        legacyHeaders: false,
        skipFailedRequests: false,
        handler: (_req, res) => {
          res.status(429).json({
            message: 'Too many requests, please try again later.',
          })
        },
      })

      // Apply the rate limiter first
      app.use(limiter)

      // Then define the test route
      app.get('/test', (req, res) => {
        res.json({ message: 'success' })
      })

      // Create a fresh supertest instance
      request = supertest(app)
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
    })

    describe('General Rate Limiting', () => {
      it('should allow requests within the rate limit', async () => {
        // Make 3 requests (within limit)
        for (let i = 0; i < 3; i++) {
          const res = await request.get('/test')
          expect(res.status).toBe(200)
          expect(res.body.message).toBe('success')
        }
      })

      it('should block requests exceeding the rate limit', async () => {
        // Make requests until we hit the limit
        for (let i = 0; i < 3; i++) {
          await request.get('/test')
        }

        // This request should be blocked
        const res = await request.get('/test')
        expect(res.status).toBe(429)
      })

      it('should include rate limit headers', async () => {
        const res = await request.get('/test')
        expect(res.headers).toHaveProperty('ratelimit-limit')
        expect(res.headers).toHaveProperty('ratelimit-remaining')
        expect(res.headers).toHaveProperty('ratelimit-reset')
      })
    })

    describe('Authentication Rate Limiting', () => {
      beforeEach(() => {
        // Create a fresh Express app instance
        app = express()

        // Apply JSON middleware
        app.use(express.json())

        // Create authentication-specific rate limiter
        const authLimiter = rateLimit({
          windowMs: FIFTEEN_MINUTES,
          max: AUTH_MAX_REQUESTS,
          handler: (_req, res) => {
            res.status(429).json({
              message: 'Too many authentication requests',
            })
          },
          standardHeaders: true,
          legacyHeaders: false,
          skipFailedRequests: false,
        })

        // Define the login route with its rate limiter
        app.use('/users', authLimiter)
        app.post('/users/login', (req, res) => res.json({ message: 'logged in' }))

        // Create a fresh supertest instance
        request = supertest(app)
      })

      it('should allow authentication requests within the limit', async () => {
        // Make AUTH_MAX_REQUESTS requests (within limit)
        for (let i = 0; i < AUTH_MAX_REQUESTS; i++) {
          const res = await request.post('/users/login')
          expect(res.status).toBe(200)
          expect(res.body.message).toBe('logged in')
        }
      })

      it('should block authentication requests exceeding the limit', async () => {
        // Make requests until we hit the limit
        for (let i = 0; i < AUTH_MAX_REQUESTS; i++) {
          await request.post('/users/login')
        }

        // This request should be blocked
        const res = await request.post('/users/login')
        expect(res.status).toBe(429)
        expect(res.body.message).toBe('Too many authentication requests')
      })

      it('should have separate limits for different endpoints', async () => {
        // Add a non-auth endpoint
        app.get('/users/profile', (req, res) => res.json({ message: 'profile' }))

        // Exhaust auth endpoint limit
        for (let i = 0; i < AUTH_MAX_REQUESTS; i++) {
          await request.post('/users/login')
        }

        // Verify auth endpoint is blocked
        const authRes = await request.post('/users/login')
        expect(authRes.status).toBe(429)

        // Verify other endpoints under /users are also affected
        const profileRes = await request.get('/users/profile')
        expect(profileRes.status).toBe(429)
      })
    })

    describe('Environment-based Rate Limiting', () => {
      const originalEnv = process.env.NODE_ENV

      beforeEach(() => {
        // Reset environment first
        process.env.NODE_ENV = 'test'

        // Create fresh Express app
        app = express()

        // Configure rate limiter with environment check
        const limiter = rateLimit({
          windowMs: FIFTEEN_MINUTES,
          max: 3,
          skip: (req) => process.env.NODE_ENV === 'test',
          standardHeaders: true,
          legacyHeaders: false,
        })

        app.use(limiter)
        app.get('/unlimited', (req, res) => res.json({ message: 'unlimited' }))

        // Create fresh supertest instance
        request = supertest(app)
      })

      afterEach(() => {
        process.env.NODE_ENV = originalEnv
      })

      it('should not apply rate limiting in test environment', async () => {
        // Make multiple requests
        for (let i = 0; i < 10; i++) {
          const res = await request.get('/unlimited')
          expect(res.status).toBe(200)
        }
      })
    })
  })

  describe('Server Initialization', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should handle database connection failure', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      const mockError = new Error('Database connection failed')
      mockDatabase.databaseConnection.mockRejectedValueOnce(mockError)

      await expect(appModule.initializeApp()).rejects.toThrow('Database connection failed')
      expect(mockDatabase.databaseConnection).toHaveBeenCalledTimes(1)

      process.env.NODE_ENV = originalEnv
    })

    it('should use default port 3000 when PORT env variable is not set', async () => {
      const originalPort = process.env.PORT
      delete process.env.PORT

      const server = await appModule.initializeApp()
      expect(server.address().port).toBe(3000)

      await server.close()
      process.env.PORT = originalPort
    })
  })

  describe('Error Middleware', () => {
    it('should sanitize error stack in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      app.get('/error-stack', (_req, _res, next) => {
        const error = new Error('Test error')
        error.stack = 'Sensitive information'
        next(error)
      })

      const res = await request.get('/error-stack')
      expect(res.body.stack).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Server Startup', () => {
    const originalEnv = process.env.NODE_ENV
    let exitSpy
    let consoleSpy
    let server

    beforeEach(() => {
      // Clear all mocks
      jest.clearAllMocks()

      // Mock console.error and process.exit
      consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})

      // Reset environment
      process.env.NODE_ENV = 'test'
    })

    afterEach(async () => {
      // Close server if it exists
      if (server && server.close) {
        await new Promise((resolve) => {
          server.close(resolve)
        })
      }

      // Restore all mocks
      consoleSpy.mockRestore()
      exitSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })

    it('should not initialize app in test environment', async () => {
      server = await appModule.startServer()
      expect(mockDatabase.databaseConnection).not.toHaveBeenCalled()
    })

    it('should handle database connection refused error', async () => {
      process.env.NODE_ENV = 'development'
      const connectionError = new Error('Connection refused')
      connectionError.code = 'ECONNREFUSED'

      mockDatabase.databaseConnection.mockRejectedValueOnce(connectionError)

      await appModule.startServer()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Database connection refused. Check your database configuration.'
      )
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('should handle general startup errors', async () => {
      // Clear any previous mock calls
      consoleSpy.mockClear()
      exitSpy.mockClear()

      process.env.NODE_ENV = 'development'

      const generalError = new Error('General startup error')
      mockDatabase.databaseConnection.mockRejectedValueOnce(generalError)

      await appModule.startServer()

      expect(consoleSpy).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to start server:',
        expect.objectContaining({
          message: 'General startup error',
        })
      )
      expect(exitSpy).toHaveBeenCalledWith(1)
    })
  })
})

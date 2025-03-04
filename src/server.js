import express from 'express'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cache from 'memory-cache'
import paginate from 'express-paginate'
import config from './config/config.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'

// CORS
import cors from 'cors'

// Middleware
import { errorMiddleware, SpecificError } from './middleware/errorMiddleware.js'
import { logMiddleware } from './middleware/logMiddleware.js'
import { securityMiddleware } from './middleware/securityMiddleware.js'

// Configuration
import { databaseConnection, initializeDatabase } from './config/database.js'

// Routes
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { courseRouter } from './routes/courses.js'
import { enrollmentRouter } from './routes/enrollments.js'
import { groupsRouter } from './routes/groups.js'

// Token cleanup
import TokenCleanup from './utils/tokenCleanup.js'

const app = express()

// CORS configuration
const allowedOrigins = config.cors.origins
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  optionsSuccessStatus: config.cors.optionsSuccessStatus,
  credentials: config.cors.credentials,
}

app.use(cors(corsOptions))

app.use(express.json())

// Performance Middleware
app.use(compression())

// Rate limiting
const FIFTEEN_MINUTES = config.api.rateLimit.window
const AUTH_MAX_REQUESTS = config.api.rateLimit.auth.max

// Apply rate limiting based on environment variables
const applyRateLimiter = config.env !== 'test'

// Rate limiting
if (applyRateLimiter) {
  const generalLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: config.api.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ message: 'Too many requests, please try again later' })
    },
  })

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
  })

  // Apply auth limiter to auth routes
  app.use('/api/auth/refresh', authLimiter)
  app.use('/api/auth/login', authLimiter)
  app.use('/api/auth/logout', authLimiter)
  app.use('/api/auth/validate', authLimiter)

  // Apply auth limiter only to user authentication endpoints
  app.use('/api/users/register', authLimiter)
  app.use('/api/users/reset-password', authLimiter)

  // Apply general limiter to all API routes EXCEPT specific auth routes
  app.use('/api', (req, res, next) => {
    // Skip if already processed by auth limiter
    const authPaths = ['/login', '/register', '/refresh', '/forgot-password', '/reset-password']
    const isAuthPath =
      (req.path.startsWith('/auth') || req.path.startsWith('/users')) &&
      authPaths.some((path) => req.path.includes(path))

    if (isAuthPath) {
      return next()
    }

    // Apply general limiter to all other API routes
    generalLimiter(req, res, next)
  })
}

// Pagination middleware
app.use(paginate.middleware(config.pagination.defaultLimit, config.pagination.maxLimit))

/**
 * Middleware function for caching responses.
 *
 * @param {number} duration - The cache duration in seconds
 * @returns {Function} - Express middleware function that:
 *   1. Checks if a cached response exists for the request URL and body
 *   2. Returns the cached response if available
 *   3. Otherwise, intercepts the response to cache it before sending
 *   4. Only caches successful responses (status code 200-299)
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}${JSON.stringify(req.body)}`
    const cachedBody = cache.get(key)

    if (cachedBody) {
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.put(key, body, duration * 1000)
        }
        res.sendResponse(body)
      }
      next()
    }
  }
}

const CACHE_DURATION = config.cache.duration[config.env]
if (config.cache.enabled) {
  app.use('/api/courses', cacheMiddleware(CACHE_DURATION))
}

// Other Middleware
app.use(logMiddleware)
securityMiddleware.forEach((middleware) => app.use(middleware))

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Aralkademy API Documentation',
  })
)

app.get('/', (_req, res) => {
  res.send('API is running. View documentation at /api-docs')
})

app.use('/api/users', usersRouter)
app.use('/api/courses', courseRouter)
app.use('/api/auth', authRouter)
app.use('/api/enrollments', enrollmentRouter)
app.use('/api/groups', groupsRouter)

app.get('/api/error', (_req, _res, next) => {
  next(new Error('Intentional error for testing'))
})

// 404 Handler (after routes, before errorMiddleware)
app.use((_req, _res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use(errorMiddleware)

/**
 * Initializes the application by establishing a database connection,
 * setting up the database (except in test environment), and starting the server.
 * Also schedules token cleanup in non-test environments.
 *
 * @async
 * @function initializeApp
 * @returns {Promise<Object>} A Promise that resolves to the server instance
 * @throws {Error} If database connection or initialization fails
 */
export const initializeApp = async () => {
  await databaseConnection()

  if (config.env !== 'test') {
    await initializeDatabase()
  }

  const server = app.listen(config.port, () => {
    if (config.env !== 'test') {
      console.log(`Server v${config.version} running on port ${config.port} in ${config.env} mode`)

      // Schedule token cleanup to run every hour
      TokenCleanup.scheduleTokenCleanup(config.tokenBlacklist.cleanupIntervalMinutes)
    }
  })
  return server
}

/**
 * Starts the server and initializes the application
 *
 * This function attempts to initialize the application by connecting to the database
 * and performing any necessary setup. It skips database synchronization when running
 * in test mode.
 *
 * @async
 * @function startServer
 * @returns {Promise<void>} A promise that resolves when the server has started successfully
 * @throws {Error} If the server fails to start, with specific handling for database connection refusal
 */
export const startServer = async () => {
  try {
    // Only run database sync when not testing.
    if (config.env !== 'test') {
      await initializeApp()
    }
  } catch (error) {
    console.error('Failed to start server:', error)
    if (error.code === 'ECONNREFUSED') {
      console.error('Database connection refused. Check your database configuration.')
    }
    process.exit(1)
  }
}

// Attach startServer to app for testing purposes
app.startServer = startServer

if (config.env !== 'test') {
  startServer()
}

export default app

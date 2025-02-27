import express from 'express'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cache from 'memory-cache'
import paginate from 'express-paginate'
import config from './config/config.js'

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
import { coursesRouter } from './routes/courses.js'

// Enrollment
import { enrollmentRouter } from './routes/enrollments.js'

const app = express()

// Cors configuration
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
  const limiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: config.api.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(limiter)

  const authLimiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: AUTH_MAX_REQUESTS,
    handler: (req, res) => {
      res.setHeader('ratelimit-remaining', options.max - req.rateLimit.current)
      res.setHeader('ratelimit-reset', Math.ceil(options.windowMs / 1000))
      res.status(429).json({
        message: 'Too many authentication requests',
      })
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use('/api/users', authLimiter)
}

// Pagination middleware
app.use(paginate.middleware(config.pagination.defaultLimit, config.pagination.maxLimit))

// Cache middleware (modified to only cache successful responses)
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

app.get('/', (_req, res) => {
  res.send('API is running')
})

//IMPORTANT* always put /api/ before the route
app.use('/api/users', usersRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/enrollment', enrollmentRouter)
app.use('/api/auth', authRouter)

app.get('/error', (_req, _res, next) => {
  next(new Error('Intentional error for testing'))
})

// 404 Handler (after routes, before errorMiddleware)
app.use((_req, _res, next) => {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

app.use(errorMiddleware)

export const initializeApp = async () => {
  await databaseConnection()

  if (config.env !== 'test') {
    await initializeDatabase()
  }

  const server = app.listen(config.port, () => {
    if (config.env !== 'test') {
      console.log(`Server v${config.version} running on port ${config.port} in ${config.env} mode`)
    }
  })
  return server
}

// Start server after database connection
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

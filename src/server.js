import express from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cache from 'memory-cache'
import paginate from 'express-paginate'

// Middleware
import { errorMiddleware, SpecificError } from './middleware/errorMiddleware.js'
import { logMiddleware } from './middleware/logMiddleware.js'
import { securityMiddleware } from './middleware/securityMiddleware.js'

// Configuration
import { databaseConnection } from './config/database.js'

// Routes
import { usersRouter } from './routes/users.js'
import { coursesRouter } from './routes/courses.js'

dotenv.config()

const app = express()

app.use(express.json())

// Performance Middleware
app.use(compression())

// Rate limiting
const FIFTEEN_MINUTES = 15 * 60 * 1000
const AUTH_MAX_REQUESTS = 5

// Apply rate limiting based on environment variables
const applyRateLimiter = process.env.NODE_ENV !== 'test'

// Rate limiting
if (applyRateLimiter) {
  const limiter = rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(limiter)

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
  app.use('/users', authLimiter)
}

// Pagination middleware
app.use(paginate.middleware(10, 50))

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

if (process.env.NODE_ENV !== 'test') {
  app.use('/courses', cacheMiddleware(300))
}

// Other Middleware
app.use(logMiddleware)
securityMiddleware.forEach((middleware) => app.use(middleware))

app.get('/', (_req, res) => {
  res.send('API is running')
})

app.use('/users', usersRouter)
app.use('/courses', coursesRouter)

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
  try {
    await databaseConnection()
    const PORT = process.env.PORT || 3000
    const server = app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Server running on port ${PORT}`)
      }
    })
    return server
  } catch (error) {
    console.error('Failed to initialize app:', error)
    throw error
  }
}

// Start server after database connection
const startServer = async () => {
  try {
    // Only run database sync when not testing.
    if (process.env.NODE_ENV !== 'test') {
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

startServer()

export default app

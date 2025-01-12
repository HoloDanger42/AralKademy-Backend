// 1. External dependencies
import express, { json } from 'express'
import dotenv from 'dotenv'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import cache from 'memory-cache'
import paginate from 'express-paginate'

// 2. Middleware
import { errorMiddleware } from './middleware/errorMiddleware.js'
import { logMiddleware } from './middleware/logMiddleware.js'
import { securityMiddleware } from './middleware/securityMiddleware.js'

// 3. Configuration
import { databaseConnection } from './config/database.js'

// 4. Routes
import userRouter from './routes/users.js'
import courseRouter from './routes/courses.js'

dotenv.config()

const app = express()

// Performance Middleware
app.use(compression())

// Rate limiting
if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(limiter)
}

// Pagination middleware
app.use(paginate.middleware(10, 50)) // Default: 10 items per page, max 50

// Cache middleware
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
        cache.put(key, body, duration * 1000)
        res.sendResponse(body)
      }
      next()
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  app.use('/courses', cacheMiddleware(300))
}

app.use(json())
app.use(logMiddleware)
securityMiddleware.forEach((middleware) => app.use(middleware))

app.get('/', (_req, res) => {
  res.send('API is running')
})

app.use('/users', userRouter)
app.use('/courses', courseRouter)

app.use(errorMiddleware)

// Start server after database connection
const startServer = async () => {
  try {
    await databaseConnection()
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app

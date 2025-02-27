import cors from 'cors'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import xss from 'xss-clean'

// Security constants
const FIFTEEN_MINUTES = 15 * 60 * 1000
const MAX_REQUESTS = 100
const AUTH_MAX_REQUESTS = 5
const STRICT_POLICY = true

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  maxAge: FIFTEEN_MINUTES,
  exposedHeaders: ['set-cookie'],
}

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: MAX_REQUESTS,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many requests from this IP',
    })
  },
  standardHeaders: true,
  legacyHeaders: false,
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

// Helmet configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: STRICT_POLICY,
  crossOriginOpenerPolicy: STRICT_POLICY,
  crossOriginResourcePolicy: STRICT_POLICY,
  dnsPrefetchControl: STRICT_POLICY,
  frameguard: {
    action: 'deny',
  },
  hsts: STRICT_POLICY,
  ieNoOpen: STRICT_POLICY,
  noSniff: STRICT_POLICY,
  referrerPolicy: STRICT_POLICY,
  xssFilter: STRICT_POLICY,
}

const securityMiddleware = [
  cors(corsOptions),
  helmet(helmetConfig),
  xss(),
  mongoSanitize(),
  standardLimiter,
]

export { securityMiddleware, authLimiter }

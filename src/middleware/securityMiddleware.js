import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import xss from 'xss-clean'

// Security constants
const FIFTEEN_MINUTES = 15 * 60 * 1000
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX, 10) || 5000
const AUTH_MAX_REQUESTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 50
const STRICT_POLICY = true

// Rate limiters
const standardLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: MAX_REQUESTS,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Too many authentication attempts, please try again later',
      retryAfter: Math.ceil(FIFTEEN_MINUTES / 60000),
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

const securityMiddleware = [helmet(helmetConfig), xss(), mongoSanitize(), standardLimiter]

export { securityMiddleware, authLimiter }

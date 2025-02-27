import dotenv from 'dotenv'

// Load environment variables based on NODE_ENV
const envResult = dotenv.config()

if (envResult.error) {
  throw new Error(`Error loading .env file: ${envResult.error.message}`)
}

// Required environment variables
const requiredEnvVars = {
  DB_HOST: 'Database host address',
  DB_USER: 'Database username',
  DB_PASSWORD: 'Database password',
  DB_NAME: 'Database name',
  JWT_SECRET: 'JWT authentication secret key',
}

// Validate required environment variables
Object.entries(requiredEnvVars).forEach(([envVar, description]) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing ${description} (${envVar})`)
  }
})

const config = {
  // Environment
  get env() {
    return process.env.NODE_ENV || 'development'
  },

  port: parseInt(process.env.PORT, 10) || 4000,

  // Database
  dbConfig: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT || 'postgres',
  },

  // Authentication
  jwtSecret: process.env.JWT_SECRET,

  // JWT Configuration
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET}_refresh`,
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },

  // Token blacklist configuration
  tokenBlacklist: {
    cleanupIntervalMinutes: parseInt(process.env.TOKEN_CLEANUP_INTERVAL, 10) || 60,
  },

  recaptchaSecret: process.env.RECAPTCHA_SECRET_KEY,

  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // API Rate Limiting
  api: {
    rateLimit: {
      window: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      auth: {
        max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
      },
    },
  },

  // Caching
  cache: {
    duration: {
      production: parseInt(process.env.CACHE_DURATION_PROD, 10) || 300,
      development: parseInt(process.env.CACHE_DURATION_DEV, 10) || 60,
    },
    enabled: process.env.CACHE_ENABLED === 'true',
  },

  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 50,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filename: process.env.LOG_FILE || 'aralkademy.log',
  },

  // Version information
  version: process.env.npm_package_version || '1.0.0',

  // Environment-specific features flag
  features: {
    enableRecaptcha: process.env.ENABLE_RECAPTCHA === 'true',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  },
}

// Validate configuration values
Object.entries(config).forEach(([key, value]) => {
  if (value === undefined) {
    throw new Error(`Configuration value for ${key} is undefined`)
  }
})

// Freeze configuration to prevent modifications
Object.freeze(config)

export default config

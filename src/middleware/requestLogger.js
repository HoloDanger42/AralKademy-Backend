import fs from 'fs'

// Track request counts in memory
const requestCounts = {}
const logFile = 'request-log.txt'

export const requestLogger = (req, res, next) => {
  // Skip logging for health checks
  if (req.path === '/api/health' && req.headers['render-health-check']) {
    return next()
  }

  const start = Date.now()
  const route = `${req.method} ${req.path}`

  // Increment route counter
  requestCounts[route] = (requestCounts[route] || 0) + 1

  // Log the request
  const requestInfo = `[${new Date().toISOString()}] ${route} (Count: ${requestCounts[route]})`
  fs.appendFileSync(logFile, requestInfo + '\n')

  // Capture the rate limit info if available
  const originalSend = res.send
  res.send = function (body) {
    const duration = Date.now() - start
    let logMessage = `[${new Date().toISOString()}] Response: ${res.statusCode} ${route} - ${duration}ms`

    // Add rate limit info if available in headers
    if (res.getHeader('X-RateLimit-Limit')) {
      const limit = res.getHeader('X-RateLimit-Limit')
      const remaining = res.getHeader('X-RateLimit-Remaining')
      const reset = res.getHeader('X-RateLimit-Reset')

      logMessage += ` | Rate Limit: ${remaining}/${limit} (Reset: ${new Date(reset * 1000).toISOString()})`

      // Log special warning if we're getting close to limit
      if (remaining < limit * 0.25) {
        logMessage += ' ⚠️ APPROACHING LIMIT!'
      }
    }

    fs.appendFileSync(logFile, logMessage + '\n')
    return originalSend.call(this, body)
  }

  next()
}

// Return current request counts
export const getRequestCounts = () => {
  return requestCounts
}

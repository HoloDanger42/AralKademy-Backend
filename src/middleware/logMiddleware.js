import { log } from '../utils/logger.js'

const logMiddleware = (req, res, next) => {
  const start = Date.now()

  log.info(`Request: ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
  })

  const originalSend = res.send
  res.send = function (body) {
    log.info(`Response: ${res.statusCode}`, {
      timestamp: new Date().toISOString(),
      body: body,
      duration: `${Date.now() - start}ms`,
    })
    originalSend.call(this, body)
  }

  next()
}

export { logMiddleware }

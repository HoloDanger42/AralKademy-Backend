import { log } from "../utils/logger";

const logMiddleware = (req, res, next) => {
  const start = Date.now();

  // Log request details
  log.info(`Request: ${req.method} ${req.url}`, {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body,
  });

  // Patch res.send to log before response is sent
  const originalSend = res.send;
  res.send = function (body) {
    log.info(`Response: ${res.statusCode}`, {
      timestamp: new Date().toISOString(),
      body: body,
      duration: Date.now() - start + "ms",
    });
    originalSend.call(this, body); // calling the original send method
  };

  // Move to next middleware or route handler
  next();
};

export { logMiddleware };

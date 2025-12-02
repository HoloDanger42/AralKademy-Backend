import winston from 'winston'
import config from '../config/config.js'

const log = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'aralkademy.log',
    }),
  ],
})

export { log }

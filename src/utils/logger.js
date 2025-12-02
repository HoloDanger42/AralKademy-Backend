<<<<<<< HEAD
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
=======
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
>>>>>>> 627466f638de697919d077ca56524377d406840d

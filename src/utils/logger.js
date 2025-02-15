// utils/logger.js
import winston from 'winston';

const log = winston.createLogger({
    level: 'info', // Set the minimum log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(), // Output to the console
        new winston.transports.File({ filename: 'combined.log' }), // Output to a file
    ],
});

export { log };
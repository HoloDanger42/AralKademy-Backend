import winston from "winston";

const log = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winstone.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // Output logs to console
    new winston.transports.File({ filename: "aralkademy.log" }), // Output logs to a file
  ],
});

export { log };

import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { log } from "../utils/logger.js";
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, dialect: "postgres" }
);

const databaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");
    log.info("Database connected successfully.");

    await sequelize.sync({ force: false });
    console.log("All models were synchronized successfully.");
    log.info("Database synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    log.error("Database connection failed.", error);
    throw error; // Rethrow to handle in server.js
  }
};

export { sequelize, databaseConnection };

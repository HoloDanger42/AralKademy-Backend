import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import { log } from "../utils/logger.js";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  dialect: "postgres",
};

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  dbConfig
);

const databaseConnection = async () => {
  try {
    await sequelize.authenticate();
    log.info("Database connection has been established successfully.");

    await sequelize.sync({ force: false });
    log.info("Database synchronized successfully.");
  } catch (error) {
    log.error("Database connection failed.", error);
    throw error;
  }
};

export { sequelize, databaseConnection };

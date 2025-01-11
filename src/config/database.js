import { Sequelize } from "sequelize";
import dotenv from "dotenv";
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
    // await sequelize.sync({ alter: true }) // Use this to update database schema from code
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

export { sequelize, databaseConnection };

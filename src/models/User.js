import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "Username is required.",
        },
        len: {
          args: [3, 255],
          msg: "Username must be between 3 and 255 characters.",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Email must be a valid email address",
        },
        notEmpty: {
          msg: "Email is required.",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Password is required.",
        },
        len: {
          args: [8, Infinity],
          msg: "Password must be at least 8 characters long.",
        },
      },
    },
  },
  {
    tableName: "users",
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    underscored: true, // uses snake_case for the database
  }
);

export { User };

import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Username already exists',
      },
      validate: {
        notNull: {
          msg: 'Username is required',
        },
        notEmpty: {
          msg: 'Username is required',
        },
        len: {
          args: [3, 255],
          msg: 'Username must be between 3 and 255 characters',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Email already exists',
      },
      validate: {
        notNull: {
          msg: 'Email is required',
        },
        isEmail: {
          msg: 'Email must be a valid email address',
        },
        notEmpty: {
          msg: 'Email is required',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Password is required',
        },
        notEmpty: {
          msg: 'Password is required',
        },
        len: {
          args: [8, Infinity],
          msg: 'Password must be at least 8 characters long',
        },
      },
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
)

export { User }

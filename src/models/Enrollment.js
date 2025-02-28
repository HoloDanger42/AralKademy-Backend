import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Enrollment = sequelize.define(
  'Enrollment',
  {
    enrollment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'First name cannot be null.' },
        notEmpty: { msg: 'First name cannot be empty.' },
      },
    },
    middle_initial: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 3],
          msg: 'Middle initial must be at most 3 characters.',
        },
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Last name cannot be null.' },
        notEmpty: { msg: 'Last name cannot be empty.' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: { msg: 'Email cannot be null.' },
        isEmail: { msg: 'Email must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty.' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Password cannot be null.' },
        notEmpty: { msg: 'Password cannot be empty.' },
        len: {
          args: [8, Infinity],
          msg: 'Password must be at least 8 characters long',
        },
      },
    },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: { msg: 'Birth date cannot be null.' },
        isBeforeToday(value) {
          if (value && new Date(value) >= new Date()) {
            throw new Error('Birthdate must be in the past')
          }
        },
      },
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Contact number cannot be null.' },
        notEmpty: { msg: 'Contact number is required' },
        is: {
          args: /^(?:\+63|0)9\d{9}$/,
          msg: 'Contact number must be valid',
        },
      },
    },
    year_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Year level is required.' },
        isInt: { msg: 'Year level must be an integer.' },
        min: { args: [1], msg: 'Year level must be between 1 and 6.' },
        max: { args: [6], msg: 'Year level must be between 1 and 6.' },
      },
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'schools',
        key: 'school_id',
      },
    },
    handled_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('approved', 'rejected', 'pending'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['approved', 'rejected', 'pending']],
          msg: 'Enrollment status must be one of the predefined types.',
        },
      },
    },
  },
  {
    tableName: 'enrollments',
    timestamps: true, // Enable timestamps (created_at, updated_at)
    underscored: true, // Use snake_case for column names
    paranoid: true, // Enable soft deletes (deleted_at)
  }
)

export { Enrollment }

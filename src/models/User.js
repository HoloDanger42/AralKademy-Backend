import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import bcrypt from 'bcryptjs'

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'First name cannot be null.',
        },
        notEmpty: {
          msg: 'First name cannot be empty.',
        },
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name cannot be null.',
        },
        notEmpty: {
          msg: 'Last name cannot be empty.',
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
          msg: 'Email cannot be null.',
        },
        isEmail: {
          msg: 'Email must be a valid email address',
        },
        notEmpty: {
          msg: 'Email cannot be empty.',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Password cannot be null.',
        },
        notEmpty: {
          msg: 'Password cannot be empty.',
        },
        len: {
          args: [8, Infinity],
          msg: 'Password must be at least 8 characters long',
        },
      },
      set(value) {
        const hashedPassword = bcrypt.hashSync(value, 10)
        this.setDataValue('password', hashedPassword)
      },
    },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isBeforeToday(value) {
          if (value && new Date(value) >= new Date()) {
            throw new Error('Birthdate must be in the past')
          }
        },
      },
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: 'Contact number is required',
        },
        is: {
          args: /^[0-9\s\-\(\)]+$/,
          msg: 'Contact number must be a number',
        },
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
    role: {
      type: DataTypes.ENUM('learner', 'teacher', 'admin', 'student_teacher'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Role cannot be null.',
        },
        isIn: {
          args: [['learner', 'teacher', 'admin', 'student_teacher']],
          msg: 'Invalid role type',
        },
      },
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['school_id'],
      },
    ],
  }
)

import { School } from './School.js'
import { StudentTeacher } from './StudentTeacher.js'
import { Teacher } from './Teacher.js'
import { Admin } from './Admin.js'
import { Learner } from './Learner.js'

User.belongsTo(School, { foreignKey: 'school_id', as: 'school' })
User.hasOne(StudentTeacher, { foreignKey: 'user_id', as: 'studentTeacher' })
User.hasOne(Teacher, { foreignKey: 'user_id', as: 'teacher' })
User.hasOne(Admin, { foreignKey: 'user_id', as: 'admin' })
User.hasOne(Learner, { foreignKey: 'user_id', as: 'learner' })

export { User }

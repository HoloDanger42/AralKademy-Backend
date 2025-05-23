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
          msg: 'First name cannot be null',
        },
        notEmpty: {
          msg: 'First name cannot be empty',
        },
      },
      set(value) {
        this.setDataValue('first_name', value.trim())
      },
    },
    middle_initial: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2],
          msg: 'Middle initial must be at most 2 characters long',
        },
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name cannot be null',
        },
        notEmpty: {
          msg: 'Last name cannot be empty',
        },
      },
      set(value) {
        this.setDataValue('last_name', value.trim())
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
          msg: 'Email cannot be null',
        },
        isEmail: {
          msg: 'Email must be a valid email address',
        },
        notEmpty: {
          msg: 'Email cannot be empty',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Password cannot be null',
        },
        notEmpty: {
          msg: 'Password cannot be empty',
        },
        len: {
          args: [8, Infinity],
          msg: 'Password must be at least 8 characters long',
        },
      },
    },
    birth_date: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isBeforeToday(value) {
          if (value) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const birthDate = new Date(value)
            birthDate.setHours(0, 0, 0, 0)

            if (birthDate >= today) {
              throw new Error('Birthdate must be in the past')
            }
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
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reset_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_code_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: true,
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

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

export { User }

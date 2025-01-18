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
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'First name is required',
        },
        notEmpty: {
          msg: 'First name is required',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Last name is required',
        },
        notEmpty: {
          msg: 'Last name is required',
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
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    school_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'School',
        key: 'id',
      },
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
)
User.associate = (models) => {
  User.belongsTo(models.School, { foreignKey: 'school_id' })
  User.hasOne(models.StudentTeacher, { foreignKey: 'user_id' })
  User.hasOne(models.Teacher, { foreignKey: 'user_id' })
  User.hasOne(models.Admin, { foreignKey: 'user_id' })
  User.hasOne(models.Learner, { foreignKey: 'user_id' })
}

export { User }

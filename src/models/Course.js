import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Course = sequelize.define(
  'Course',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        args: true,
        msg: 'Course name already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Course name is required',
        },
        len: {
          args: [1, 255],
          msg: 'Course name must be between 1 and 255 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Course description must be less than 1000 characters',
        },
      },
    },
  },
  {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
  }
)

export { Course }

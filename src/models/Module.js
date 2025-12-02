<<<<<<< HEAD
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Module = sequelize.define(
  'Module',
  {
    module_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Module name is required.',
        },
        notEmpty: {
          msg: 'Module name is required.',
        },
        len: {
          args: [1, 255],
          msg: 'Module name must be between 1 and 255 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Module description must be less than 1000 characters',
        },
      },
    },
  },
  {
    tableName: 'modules',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Module }
=======
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Module = sequelize.define(
  'Module',
  {
    module_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Module name is required.',
        },
        notEmpty: {
          msg: 'Module name is required.',
        },
        len: {
          args: [1, 255],
          msg: 'Module name must be between 1 and 255 characters',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Module description must be less than 1000 characters',
        },
      },
    },
  },
  {
    tableName: 'modules',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Module }
>>>>>>> 627466f638de697919d077ca56524377d406840d

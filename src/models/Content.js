import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Content = sequelize.define(
  'Content',
  {
    content_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'module_id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Content name is required.',
        },
        notEmpty: {
          msg: 'Content name is required.',
        },
        len: {
          args: [1, 255],
          msg: 'Content name must be between 1 and 255 characters',
        },
      },
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 5000],
          msg: 'Content text must be at most 5000 characters',
        },
      },
    }
  },
  {
    tableName: 'contents',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Content }

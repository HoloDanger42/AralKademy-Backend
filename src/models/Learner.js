import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { User } from './User.js'
import { Group } from './Group.js'

const Learner = sequelize.define(
  'Learner',
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      unique: true,
      onDelete: 'CASCADE',
    },
    section: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Section is required.',
        },
        notEmpty: {
          msg: 'Section cannot be empty.',
        },
      },
    },
    year_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Year level is required.',
        },
        isInt: {
          msg: 'Year level must be an integer.',
        },
        min: {
          args: [1],
          msg: 'Year level must be at least 1.',
        },
      },
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'group_id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'learners',
    timestamps: true,
    underscored: true,
  }
)

Learner.associate = (models) => {
  Learner.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
  Learner.belongsTo(models.Group, { foreignKey: 'group_id', as: 'group' })
}

export { Learner }

import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

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
          args: [1, 6],
          msg: 'Year level must be between 1 and 6.',
        },
      },
    },
    enrollment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'enrollments',
        key: 'enrollment_id',
      },
      onDelete: 'CASCADE',
    },
    learner_group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
  Learner.belongsTo(models.Group, { foreignKey: 'learner_group_id', as: 'group' })
  Learner.belongsTo(models.Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment'})
}

export { Learner }

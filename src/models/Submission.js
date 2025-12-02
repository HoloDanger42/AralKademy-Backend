import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Submission = sequelize.define(
  'Submission',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    assessment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assessments',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    submit_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Max score must be a positive number',
        },
      },
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'submitted', 'graded'),
      allowNull: false,
      defaultValue: 'in_progress',
    },
    is_late: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'submissions',
    timestamps: true,
    paranoid: true,
  }
)

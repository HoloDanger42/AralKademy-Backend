import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Assessment = sequelize.define(
  'Assessment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Assessment title cannot be empty',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'module_id',
      },
    },
    type: {
      type: DataTypes.ENUM('quiz', 'assignment', 'exam'),
      allowNull: false,
      defaultValue: 'quiz',
      validate: {
        min: {
          args: [0],
          msg: 'Maximum score must be a positive number',
        },
      },
    },
    passing_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Passing score must be a positive number',
        },
      },
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [1],
          msg: 'Duration must be at least 1 minute',
        },
      },
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Instructions for students taking the assessment',
    },
    allowed_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Allowed attemps must be at least one',
        },
      },
    },
  },
  {
    tableName: 'assessments',
    timestamps: true,
    paranoid: true,
  }
)

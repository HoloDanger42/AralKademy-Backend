import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const Question = sequelize.define(
  'Question',
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
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Question text cannot be empty',
        },
      },
    },
    question_type: {
      type: DataTypes.ENUM('multiple_choice', 'true_false', 'short_answer', 'essay'),
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [0],
          msg: 'Points must be a non-negative number',
        },
      },
    },
    order_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    media_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    answer_key: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Model answer or correct answer for short_answer and essay questions',
    },
    word_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Word limit must be a non-negative number',
        },
      },
      comment: 'Maximum word count for essay questions',
    },
  },
  {
    tableName: 'questions',
    timestamps: true,
    paranoid: true,
  }
)

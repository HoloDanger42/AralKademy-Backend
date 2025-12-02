<<<<<<< HEAD
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const AnswerResponse = sequelize.define(
  'AnswerResponse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    submission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'submissions',
        key: 'id',
      },
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
    },
    selected_option_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'question_options',
        key: 'id',
      },
    },
    text_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    points_awarded: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'answer_responses',
    timestamps: true,
    paranoid: true,
  }
)
=======
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const AnswerResponse = sequelize.define(
  'AnswerResponse',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    submission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'submissions',
        key: 'id',
      },
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'id',
      },
    },
    selected_option_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'question_options',
        key: 'id',
      },
    },
    text_response: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    points_awarded: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'answer_responses',
    timestamps: true,
    paranoid: true,
  }
)
>>>>>>> 627466f638de697919d077ca56524377d406840d

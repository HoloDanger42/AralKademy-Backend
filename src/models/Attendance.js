<<<<<<< HEAD
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Attendance = sequelize.define(
  'Attendance',
  {
    attendance_id: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Attendance date is required.',
        },
        notEmpty: {
          msg: 'Attendance date is required.',
        },
        isDate: {
          msg: 'Attendance date must be a valid date.',
        },
      },
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'not marked'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Attendance status is required.',
        },
        notEmpty: {
          msg: 'Attendance status is required.',
        },
        isIn: {
          args: [['present', 'absent', 'late', 'not marked']],
          msg: 'Attendance status must be either present, absent, late, or not marked.',
        },
      },
    },
  },
  {
    tableName: 'attendances',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'course_id', 'date'],
      },
    ],
  }
)

export { Attendance }
=======
import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Attendance = sequelize.define(
  'Attendance',
  {
    attendance_id: {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Attendance date is required.',
        },
        notEmpty: {
          msg: 'Attendance date is required.',
        },
        isDate: {
          msg: 'Attendance date must be a valid date.',
        },
      },
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'not marked'),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Attendance status is required.',
        },
        notEmpty: {
          msg: 'Attendance status is required.',
        },
        isIn: {
          args: [['present', 'absent', 'late', 'not marked']],
          msg: 'Attendance status must be either present, absent, late, or not marked.',
        },
      },
    },
  },
  {
    tableName: 'attendances',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'course_id', 'date'],
      },
    ],
  }
)

export { Attendance }
>>>>>>> 627466f638de697919d077ca56524377d406840d

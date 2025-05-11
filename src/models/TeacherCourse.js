import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const TeacherCourse = sequelize.define(
  'TeacherCourse',
  {
    teacher_course_id: {
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
  },
  {
    tableName: 'teachercourses',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
            {
                unique: true,
                fields: ['user_id', 'course_id'],
            },
        ],
  }
)

export { TeacherCourse }

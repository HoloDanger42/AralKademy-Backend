import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Group = sequelize.define(
  'Group',
  {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Group name is required.',
        },
        notEmpty: {
          msg: 'Group name cannot be empty.',
        },
      },
    },
    group_type: {
      type: DataTypes.ENUM('student_teacher', 'learner'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['student_teacher', 'learner']],
          msg: 'Group type must be one of the predefined types.',
        },
      },
    },
  },
  {
    tableName: 'groups',
    timestamps: true,
    underscored: true,
  }
)

Group.associate = (models) => {
  Group.hasMany(models.Learner, { foreignKey: 'learner_group_id', as: 'learners' })
  Group.hasMany(models.StudentTeacher, { foreignKey: 'student_teacher_group_id', as: 'studentTeachers' });
  Group.hasOne(models.Course, { foreignKey: 'student_teacher_group_id', as: 'studentTeacherCourse' });
  Group.hasOne(models.Course, { foreignKey: 'learner_group_id', as: 'learnerCourse' });
}

export { Group }

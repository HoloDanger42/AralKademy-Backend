import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const StudentTeacher = sequelize.define(
  'StudentTeacher',
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
      onUpdate: 'CASCADE',
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
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Department is required.',
        },
        notEmpty: {
          msg: 'Department cannot be empty.',
        },
      },
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'group_id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    tableName: 'student_teachers',
    timestamps: true,
    underscored: true,
  }
)

StudentTeacher.associate = (models) => {
  StudentTeacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
  StudentTeacher.belongsTo(models.Group, { foreignKey: 'group_id', as: 'group' })
}

export { StudentTeacher }

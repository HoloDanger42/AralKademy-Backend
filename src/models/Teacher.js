import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Teacher = sequelize.define(
  'Teacher',
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
    emp_status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Employment status is required.',
        },
        notEmpty: {
          msg: 'Employment status cannot be empty.',
        },
      },
    },
  },
  {
    tableName: 'teachers',
    timestamps: true,
    underscored: true,
  }
)

Teacher.associate = (models) => {
  Teacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
}

export { Teacher }

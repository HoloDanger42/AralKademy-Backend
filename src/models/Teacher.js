import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Teacher = sequelize.define(
  'Teacher',
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    tableName: 'teachers',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Teacher }

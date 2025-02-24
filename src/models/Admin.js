import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Admin = sequelize.define(
  'Admin',
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
    },
  },
  {
    tableName: 'admins',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

export { Admin }

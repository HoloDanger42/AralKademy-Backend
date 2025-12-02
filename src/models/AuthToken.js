import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

export const AuthToken = sequelize.define(
  'authToken',
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM('magic_link', 'numeric_code', 'picture_code'),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: 'auth_tokens',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['token'] },
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
    ],
  }
)

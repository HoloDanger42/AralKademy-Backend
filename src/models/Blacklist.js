import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js'

const Blacklist = sequelize.define(
  'Blacklist',
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: 'blacklist',
    timestamps: false,
  }
);

export { Blacklist }

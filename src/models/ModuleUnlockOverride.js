import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const ModuleUnlockOverride = sequelize.define(
  'ModuleUnlockOverride',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'user_id cannot be null'
        }
      }
    },
    unlocked_module_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'modules',
        key: 'module_id',
      },
      validate: {
        notNull: {
          msg: 'unlocked_module_id cannot be null'
        }
      }
    },
    overridden_by_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'overridden_by_user_id cannot be null'
        }
      }
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
  },
  {
    tableName: 'module_unlock_overrides',
    timestamps: true,
  }
)

export { ModuleUnlockOverride }

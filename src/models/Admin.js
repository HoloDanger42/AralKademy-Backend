<<<<<<< HEAD
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
      onUpdate: 'CASCADE',
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
=======
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
      onUpdate: 'CASCADE',
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
>>>>>>> 627466f638de697919d077ca56524377d406840d

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
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Position is required.',
        },
        notEmpty: {
          msg: 'Position cannot be empty.',
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
    tableName: 'admins',
    timestamps: true,
    underscored: true,
  }
)

Admin.associate = (models) => {
  Admin.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
}

export { Admin }

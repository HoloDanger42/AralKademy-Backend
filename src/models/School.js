import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const School = sequelize.define(
  'School',
  {
    school_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'School name is required',
        },
        notEmpty: {
          msg: 'School name is required',
        },
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Address is required',
        },
        notEmpty: {
          msg: 'Address is required',
        },
      },
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9-+\s]+$/,
        msg: 'Contact number must be valid',
      },
    },
  },
  {
    tableName: 'schools',
    timestamps: true,
    underscored: true,
  }
)

School.associate = (models) => {
  School.hasMany(models.User, { foreignKey: 'school_id' })
}

export { School }

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
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Contact number is required',
        },
        is: {
          args: /^(?:\+63|0)?(?:2|3\d{2})[-\s]?\d{3,4}[-\s]?\d{4}$/,
          msg: 'Contact number must be valid',
        },
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
  School.hasMany(models.User, { foreignKey: 'school_id', as: 'users' })
  School.hasMany(models.Enrollment, { foreignKey: 'school_id', as: 'enrollments' })
}

export { School }

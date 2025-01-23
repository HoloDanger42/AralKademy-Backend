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
  },
  {
    tableName: 'teachers',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

Teacher.associate = (models) => {
  Teacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' })
  Teacher.hasMany(models.Course, { foreignKey: 'user_id', as: 'courses' })
}

export { Teacher }

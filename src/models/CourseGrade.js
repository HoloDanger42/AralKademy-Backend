import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const CourseGrade = sequelize.define(
    'CourseGrade',
    {
        course_grade_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'courses',
                key: 'id',
            },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        grade: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: {
                  args: [0], 
                  msg: 'Grade must be at least 0'
                }
              }
        }
    },
    {
        tableName: 'coursegrades',
        timestamps: true,
        underscored: true,
        paranoid: true,
    }
)  

export { CourseGrade }
    

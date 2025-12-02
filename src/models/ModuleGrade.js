import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const ModuleGrade = sequelize.define(
    'ModuleGrade',
    {
        module_grade_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        module_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'modules',
                key: 'module_id',
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
        tableName: 'modulegrades',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            {
                unique: true,
                fields: ['user_id', 'module_id'],
            },
        ],
    }
)  

export { ModuleGrade }
    

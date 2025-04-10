import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'

const Announcement = sequelize.define(
    'Announcement',
    {
        announcement_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        is_global: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        course_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'courses',
                key: 'id',
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Announcement title is required.',
                },
                notEmpty: {
                    msg: 'Announcement title is required.',
                },
                len: {
                    args: [1, 255],
                    msg: 'Announcement title must be between 1 and 255 characters',
                },
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'Announcement message is required.',
                },
                notEmpty: {
                    msg: 'Announcement message is required.',
                },
                len: {
                    args: [1, 5000],
                    msg: 'Announcement message must be between 1 and 5000 characters',
                },
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
    },
    {
        tableName: 'modules',
        timestamps: true,
        underscored: true,
        paranoid: true,
    }
)  

export { Announcement }
    

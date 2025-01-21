'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'First name is required',
          },
          notEmpty: {
            msg: 'First name cannot be empty',
          },
        },
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Last name is required',
          },
          notEmpty: {
            msg: 'Last name cannot be empty',
          },
        },
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: {
            msg: 'Email must be a valid email address',
          },
          notEmpty: {
            msg: 'Email cannot be empty',
          },
        },
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Password is required',
          },
          notEmpty: {
            msg: 'Password cannot be empty',
          },
          len: {
            args: [8, 100],
            msg: 'Password must be at least 8 characters long',
          },
        },
      },
      birth_date: {
        type: Sequelize.DATE,
        allowNull: true,
        validate: {
          isBeforeToday(value) {
            if (value && new Date(value) >= new Date()) {
              throw new Error('Birthdate must be in the past')
            }
          },
        },
      },
      contact_no: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9\s\-()+]+$/,
          msg: 'Contact number must be valid',
        },
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'schools',
          key: 'school_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('users')
  },
}

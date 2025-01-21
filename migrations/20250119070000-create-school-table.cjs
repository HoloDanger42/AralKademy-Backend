'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schools', {
      school_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'School name is required',
          },
          notEmpty: {
            msg: 'School name cannot be empty',
          },
        },
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Address is required',
          },
          notEmpty: {
            msg: 'Address cannot be empty',
          },
        },
      },
      contact_no: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          is: /^[0-9-+\s]+$/,
          msg: 'Contact number must be valid',
        },
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
    // const indexExists = await queryInterface.hasIndex('schools', 'schools_name_index')

    // if (!indexExists) {
    //   await queryInterface.addIndex('schools', {
    //     fields: ['name'],
    //     name: 'schools_name_index',
    //     unique: false,
    //   })
    // }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('schools')
  },
}

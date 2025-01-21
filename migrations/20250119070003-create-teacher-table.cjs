'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('teachers', {
      teacher_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      department: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notNull: {
            msg: 'Department is required.',
          },
          notEmpty: {
            msg: 'Department cannot be empty.',
          },
        },
      },
      emp_status: {
        type: Sequelize.STRING,
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

    // Add indexes if necessary
    await queryInterface.addIndex('teachers', ['user_id'], {
      unique: true,
      name: 'teachers_user_id_unique',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('teachers')
  },
}

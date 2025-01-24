'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      birth_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      contact_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('admin', 'teacher', 'learner'),
        allowNull: false,
      },
      school_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'schools',
          key: 'school_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })

    // Add indexes
    await queryInterface.addIndex('users', ['email'])
    await queryInterface.addIndex('users', ['school_id'])
  },

  async down(queryInterface) {
    try {
      // Remove indexes first
      await queryInterface.removeIndex('users', ['email'])
      await queryInterface.removeIndex('users', 'idx_users_school_id')

      // Drop dependent tables in order
      await queryInterface.dropTable('student_teachers', { cascade: true })
      await queryInterface.dropTable('teachers', { cascade: true })
      await queryInterface.dropTable('admins', { cascade: true })
      await queryInterface.dropTable('users', { cascade: true })
    } catch (error) {
      if (!error.message.includes('does not exist')) {
        throw error
      }
    }
  },
}

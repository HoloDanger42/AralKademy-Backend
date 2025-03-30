'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add allowed_attempts column with default value of 1
    await queryInterface.addColumn('assessments', 'allowed_attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    })

    // Rename course_id to module_id (if the column exists)
    const tableInfo = await queryInterface.describeTable('assessments')
    if (tableInfo.course_id) {
      await queryInterface.renameColumn('assessments', 'course_id', 'module_id')

      // Update foreign key if needed
      await queryInterface.removeConstraint('assessments', 'assessments_course_id_fkey')
      await queryInterface.addConstraint('assessments', {
        fields: ['module_id'],
        type: 'foreign key',
        name: 'assessments_module_id_fkey',
        references: {
          table: 'modules',
          field: 'module_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    }
  },

  async down(queryInterface, Sequelize) {
    // Revert the allowed_attempts column addition
    await queryInterface.removeColumn('assessments', 'allowed_attempts')

    // Revert the column rename (if applicable)
    const tableInfo = await queryInterface.describeTable('assessments')
    if (tableInfo.module_id) {
      await queryInterface.renameColumn('assessments', 'module_id', 'course_id')

      // Revert foreign key if needed
      await queryInterface.removeConstraint('assessments', 'assessments_module_id_fkey')
      await queryInterface.addConstraint('assessments', {
        fields: ['course_id'],
        type: 'foreign key',
        name: 'assessments_course_id_fkey',
        references: {
          table: 'courses',
          field: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    }
  },
}

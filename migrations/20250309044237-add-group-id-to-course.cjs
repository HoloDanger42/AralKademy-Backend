'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('courses', 'student_teacher_group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'group_id',
      },
    })

    await queryInterface.addColumn('courses', 'learner_group_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'groups',
        key: 'group_id',
      },
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('courses', 'student_teacher_group_id')
    await queryInterface.removeColumn('courses', 'learner_group_id')
  },
}

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('incomes', 'recurrence_exceptions', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('expenses', 'recurrence_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('expenses', 'recurrence_until', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('expenses', 'recurrence_exceptions', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      'UPDATE expenses SET recurrence_id = id WHERE is_recurring = true AND recurrence_id IS NULL;'
    );

    await queryInterface.addIndex('expenses', ['recurrence_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('expenses', ['recurrence_id']);
    await queryInterface.removeColumn('expenses', 'recurrence_exceptions');
    await queryInterface.removeColumn('expenses', 'recurrence_until');
    await queryInterface.removeColumn('expenses', 'recurrence_id');
    await queryInterface.removeColumn('incomes', 'recurrence_exceptions');
  },
};


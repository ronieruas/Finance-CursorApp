'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('expenses', 'recurrence_frequency', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('expenses', 'recurrence_interval', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    await queryInterface.sequelize.query(
      "UPDATE expenses SET recurrence_frequency = 'monthly' WHERE is_recurring = true AND (recurrence_frequency IS NULL OR recurrence_frequency = '');"
    );

    await queryInterface.sequelize.query(
      'UPDATE expenses SET recurrence_interval = 1 WHERE is_recurring = true AND (recurrence_interval IS NULL OR recurrence_interval < 1);'
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('expenses', 'recurrence_interval');
    await queryInterface.removeColumn('expenses', 'recurrence_frequency');
  },
};


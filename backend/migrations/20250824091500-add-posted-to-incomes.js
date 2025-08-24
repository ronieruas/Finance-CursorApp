'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('incomes', 'posted', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    // Backfill: marcar como postadas as receitas com data no passado ou hoje
    await queryInterface.sequelize.query("UPDATE \"incomes\" SET \"posted\" = true WHERE \"date\" <= CURRENT_DATE;");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('incomes', 'posted');
  }
};
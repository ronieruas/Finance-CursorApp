'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('credit_cards', 'debito_automatico', { type: Sequelize.BOOLEAN, defaultValue: false });
    await queryInterface.addColumn('credit_cards', 'conta_debito_id', { type: Sequelize.INTEGER });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('credit_cards', 'debito_automatico');
    await queryInterface.removeColumn('credit_cards', 'conta_debito_id');
  }
}; 
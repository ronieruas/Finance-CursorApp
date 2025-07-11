'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.dropTable('credit_card_transactions');
  },

  async down (queryInterface, Sequelize) {
    // Não implementado: a tabela será recriada pela migration de criação
  }
}; 
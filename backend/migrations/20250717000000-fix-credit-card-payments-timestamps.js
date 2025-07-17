'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Renomear createdAt para created_at se existir
    const table = await queryInterface.describeTable('credit_card_payments');
    if (table.createdAt) {
      await queryInterface.renameColumn('credit_card_payments', 'createdAt', 'created_at');
    }
    if (table.updatedAt) {
      await queryInterface.renameColumn('credit_card_payments', 'updatedAt', 'updated_at');
    }
    // Adicionar created_at se não existir
    if (!table.created_at) {
      await queryInterface.addColumn('credit_card_payments', 'created_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      });
    }
    // Adicionar updated_at se não existir
    if (!table.updated_at) {
      await queryInterface.addColumn('credit_card_payments', 'updated_at', {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      });
    }
  },

  async down (queryInterface, Sequelize) {
    // Não desfaz para evitar perda de dados
  }
}; 
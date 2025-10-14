'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verifica colunas existentes antes de adicionar
    const table = await queryInterface.describeTable('expenses');

    if (!table.installment_number) {
      await queryInterface.addColumn('expenses', 'installment_number', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      });
    }

    if (!table.installment_total) {
      await queryInterface.addColumn('expenses', 'installment_total', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove as colunas (se existirem)
    const table = await queryInterface.describeTable('expenses');
    if (table.installment_number) {
      await queryInterface.removeColumn('expenses', 'installment_number');
    }
    if (table.installment_total) {
      await queryInterface.removeColumn('expenses', 'installment_total');
    }
  }
};
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('expenses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      account_id: { type: Sequelize.INTEGER },
      credit_card_id: { type: Sequelize.INTEGER },
      installment_number: { type: Sequelize.INTEGER, defaultValue: 1 },
      installment_total: { type: Sequelize.INTEGER, defaultValue: 1 },
      description: { type: Sequelize.STRING, allowNull: false },
      value: { type: Sequelize.DECIMAL(14,2), allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      category: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('paga', 'pendente', 'atrasada'), defaultValue: 'pendente' },
      is_recurring: { type: Sequelize.BOOLEAN, defaultValue: false },
      auto_debit: { type: Sequelize.BOOLEAN, defaultValue: false },
      paid_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('expenses');
  }
};

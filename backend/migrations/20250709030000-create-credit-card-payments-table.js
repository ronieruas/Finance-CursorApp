'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('credit_card_payments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      card_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      account_id: { type: Sequelize.INTEGER, allowNull: false },
      value: { type: Sequelize.DECIMAL(14,2), allowNull: false },
      payment_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_full_payment: { type: Sequelize.BOOLEAN, defaultValue: true },
      auto_debit: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('credit_card_payments');
  }
}; 
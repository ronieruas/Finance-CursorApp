'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('credit_card_transactions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      card_id: { type: Sequelize.INTEGER, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: false },
      value: { type: Sequelize.DECIMAL(14,2), allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      category: { type: Sequelize.STRING },
      installment_number: { type: Sequelize.INTEGER, defaultValue: 1 },
      installment_total: { type: Sequelize.INTEGER, defaultValue: 1 },
      family_member: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('credit_card_transactions');
  }
};
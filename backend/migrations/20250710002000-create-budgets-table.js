'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('budgets', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      name: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('geral', 'cartao'), allowNull: false },
      credit_card_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'credit_cards', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL' },
      period_start: { type: Sequelize.DATEONLY, allowNull: false },
      period_end: { type: Sequelize.DATEONLY, allowNull: false },
      planned_value: { type: Sequelize.DECIMAL(14,2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('budgets');
  }
};
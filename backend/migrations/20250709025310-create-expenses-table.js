'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
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
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE },
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};

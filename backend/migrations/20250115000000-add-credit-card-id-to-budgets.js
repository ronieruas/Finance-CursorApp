'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('budgets', 'credit_card_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'credit_cards',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('budgets', 'credit_card_id');
  }
}; 
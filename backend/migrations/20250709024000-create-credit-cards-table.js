'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('credit_cards', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bank: {
        type: Sequelize.STRING,
      },
      brand: {
        type: Sequelize.STRING,
      },
      limit_value: {
        type: Sequelize.DECIMAL(14,2),
        allowNull: false,
      },
      due_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      closing_day: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM('ativa', 'inativa'),
        defaultValue: 'ativa',
      },
      debito_automatico: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      conta_debito_id: {
        type: Sequelize.INTEGER,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('credit_cards');
  }
};
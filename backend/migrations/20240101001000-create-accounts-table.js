'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('accounts', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bank: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.ENUM('corrente', 'poupanca', 'investimento'),
        allowNull: false,
      },
      balance: {
        type: Sequelize.DECIMAL(14,2),
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('ativa', 'inativa'),
        defaultValue: 'ativa',
      },
      currency: {
        type: Sequelize.ENUM('BRL', 'USD', 'EUR'),
        defaultValue: 'BRL',
        allowNull: false,
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
    await queryInterface.dropTable('accounts');
  }
}; 
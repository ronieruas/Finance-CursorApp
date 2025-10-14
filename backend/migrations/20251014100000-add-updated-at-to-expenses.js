'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('expenses');
    if (!table.updated_at) {
      await queryInterface.addColumn('expenses', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('expenses');
    if (table.updated_at) {
      await queryInterface.removeColumn('expenses', 'updated_at');
    }
  }
};
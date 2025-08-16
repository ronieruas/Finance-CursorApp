const { query } = require('express');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // This seeder is for development purposes only.
    // It clears all data from tables that might have foreign key constraints
    // on the `users` table, allowing the `users` table to be cleared.
    await queryInterface.bulkDelete('accounts', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('incomes', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('expenses', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('credit_cards', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('credit_card_payments', null, { truncate: true, cascade: true });

    await queryInterface.bulkDelete('notifications', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('transfers', null, { truncate: true, cascade: true });
  },

  down: async (queryInterface, Sequelize) => {
    // No-op for down migration as this is a cleanup seeder
  }
};
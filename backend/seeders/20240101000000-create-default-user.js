'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const existingUser = await queryInterface.rawSelect('users', {
      where: { email: 'user@example.com' },
    }, ['id']);

    if (!existingUser) {
      await queryInterface.bulkInsert('users', [{
        name: 'Default User',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }], {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
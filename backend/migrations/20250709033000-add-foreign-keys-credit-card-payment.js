'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('credit_card_payments', {
      fields: ['card_id'],
      type: 'foreign key',
      name: 'fk_credit_card_payments_card_id',
      references: { table: 'credit_cards', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('credit_card_payments', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_credit_card_payments_user_id',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    await queryInterface.addConstraint('credit_card_payments', {
      fields: ['account_id'],
      type: 'foreign key',
      name: 'fk_credit_card_payments_account_id',
      references: { table: 'accounts', field: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('credit_card_payments', 'fk_credit_card_payments_card_id');
    await queryInterface.removeConstraint('credit_card_payments', 'fk_credit_card_payments_user_id');
    await queryInterface.removeConstraint('credit_card_payments', 'fk_credit_card_payments_account_id');
  }
}; 
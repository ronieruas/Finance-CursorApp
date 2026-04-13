'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('financial_audit_logs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: { type: Sequelize.INTEGER, allowNull: true },
      action: { type: Sequelize.STRING, allowNull: false },
      entity_type: { type: Sequelize.STRING, allowNull: true },
      entity_id: { type: Sequelize.INTEGER, allowNull: true },
      details: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('financial_audit_logs', ['user_id']);
    await queryInterface.addIndex('financial_audit_logs', ['action']);
    await queryInterface.addIndex('financial_audit_logs', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('financial_audit_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('financial_audit_logs');
  },
};


'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') return;

    await queryInterface.sequelize.query('ALTER TABLE incomes DROP CONSTRAINT IF EXISTS chk_incomes_recurrence_id_required;');
    await queryInterface.sequelize.query('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS chk_expenses_recurrence_id_required;');
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') return;

    await queryInterface.sequelize.query(
      'ALTER TABLE incomes ADD CONSTRAINT chk_incomes_recurrence_id_required CHECK (is_recurring = false OR recurrence_id IS NOT NULL);'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE expenses ADD CONSTRAINT chk_expenses_recurrence_id_required CHECK (is_recurring = false OR recurrence_id IS NOT NULL);'
    );
  },
};


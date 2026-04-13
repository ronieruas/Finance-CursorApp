'use strict';

module.exports = {
  async up(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    await queryInterface.addIndex('incomes', ['user_id', 'recurrence_id', 'date'], {
      unique: true,
      name: 'uniq_incomes_user_series_date',
    });

    await queryInterface.addIndex('expenses', ['user_id', 'recurrence_id', 'due_date'], {
      unique: true,
      name: 'uniq_expenses_user_series_due_date',
    });

    await queryInterface.addIndex('credit_card_payments', ['user_id', 'card_id', 'payment_date', 'value'], {
      unique: true,
      name: 'uniq_cc_payments_user_card_date_value',
    });

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        'ALTER TABLE incomes ADD CONSTRAINT chk_incomes_recurrence_id_required CHECK (is_recurring = false OR recurrence_id IS NOT NULL);'
      ).catch(() => {});

      await queryInterface.sequelize.query(
        'ALTER TABLE expenses ADD CONSTRAINT chk_expenses_recurrence_id_required CHECK (is_recurring = false OR recurrence_id IS NOT NULL);'
      ).catch(() => {});
    }
  },

  async down(queryInterface) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query('ALTER TABLE incomes DROP CONSTRAINT IF EXISTS chk_incomes_recurrence_id_required;');
      await queryInterface.sequelize.query('ALTER TABLE expenses DROP CONSTRAINT IF EXISTS chk_expenses_recurrence_id_required;');
    }

    await queryInterface.removeIndex('credit_card_payments', 'uniq_cc_payments_user_card_date_value');
    await queryInterface.removeIndex('expenses', 'uniq_expenses_user_series_due_date');
    await queryInterface.removeIndex('incomes', 'uniq_incomes_user_series_date');
  },
};


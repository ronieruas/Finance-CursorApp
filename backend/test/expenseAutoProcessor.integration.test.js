const test = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes, Model } = require('sequelize');

const { processExpensesAutomatic } = require('../src/services/expenseAutoProcessor');

function defineModels(sequelize) {
  class Account extends Model {}
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      name: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'Account', tableName: 'accounts', underscored: true, timestamps: false }
  );

  class Expense extends Model {}
  Expense.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: true },
      value: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pendente' },
      auto_debit: { type: DataTypes.BOOLEAN, allowNull: true },
      paid_at: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'Expense', tableName: 'expenses', underscored: true, timestamps: false }
  );

  class FinancialAuditLog extends Model {}
  FinancialAuditLog.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      action: { type: DataTypes.STRING, allowNull: false },
      entity_type: { type: DataTypes.STRING, allowNull: true },
      entity_id: { type: DataTypes.INTEGER, allowNull: true },
      details: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'FinancialAuditLog', tableName: 'financial_audit_logs', underscored: true, timestamps: false }
  );

  return { Account, Expense, FinancialAuditLog };
}

test('processExpensesAutomatic é idempotente quando executado mais de uma vez', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const { Account, Expense, FinancialAuditLog } = defineModels(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 1, user_id: 1, balance: 1000, name: 'Conta' });
  await Expense.create({
    id: 10,
    user_id: 1,
    account_id: 1,
    value: 100,
    due_date: '2000-01-01',
    status: 'pendente',
    auto_debit: true,
    paid_at: null,
  });
  await Expense.create({
    id: 11,
    user_id: 1,
    account_id: 1,
    value: 200,
    due_date: '2000-01-01',
    status: 'pendente',
    auto_debit: false,
    paid_at: null,
  });
  await Expense.create({
    id: 12,
    user_id: 1,
    account_id: 1,
    value: 50,
    due_date: '2099-01-01',
    status: 'pendente',
    auto_debit: false,
    paid_at: new Date('2000-01-02T00:00:00Z'),
  });

  const first = await processExpensesAutomatic({
    Expense,
    Account,
    FinancialAuditLog,
    sequelize,
    generateNextRecurringExpenses: async () => ({ created: 0 }),
    now: new Date('2026-01-01T12:00:00Z'),
  });
  const second = await processExpensesAutomatic({
    Expense,
    Account,
    FinancialAuditLog,
    sequelize,
    generateNextRecurringExpenses: async () => ({ created: 0 }),
    now: new Date('2026-01-01T12:00:00Z'),
  });

  const account = await Account.findByPk(1);
  assert.equal(Number(account.balance), 850);

  const autoDebitExpense = await Expense.findByPk(10);
  assert.equal(autoDebitExpense.status, 'paga');

  const normalOverdueExpense = await Expense.findByPk(11);
  assert.equal(normalOverdueExpense.status, 'pendente');

  const paidAtExpense = await Expense.findByPk(12);
  assert.equal(paidAtExpense.status, 'paga');

  assert.equal(first.auto_debit_paid, 1);
  assert.equal(second.auto_debit_paid, 0);
  assert.equal(first.paid, 1);
  assert.equal(second.paid, 0);

  await sequelize.close();
});

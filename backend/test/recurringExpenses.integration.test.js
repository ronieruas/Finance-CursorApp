const test = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes, Model } = require('sequelize');

const {
  deleteRecurringExpenseOccurrenceOnly,
  deleteRecurringExpenseSeries,
  generateNextRecurringExpenses,
  stopRecurringExpenseSeriesFrom
} = require('../src/services/recurringExpenses');

function defineExpense(sequelize) {
  class Expense extends Model {}
  Expense.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: true },
      credit_card_id: { type: DataTypes.INTEGER, allowNull: true },
      installment_number: { type: DataTypes.INTEGER, defaultValue: 1 },
      installment_total: { type: DataTypes.INTEGER, defaultValue: 1 },
      description: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pendente' },
      is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
      recurrence_id: { type: DataTypes.INTEGER, allowNull: true },
      recurrence_until: { type: DataTypes.DATEONLY, allowNull: true },
      recurrence_exceptions: { type: DataTypes.TEXT, allowNull: true },
      auto_debit: { type: DataTypes.BOOLEAN, defaultValue: false },
      paid_at: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'Expense', tableName: 'expenses', underscored: true, timestamps: false }
  );
  return Expense;
}

function defineAccount(sequelize) {
  class Account extends Model {}
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: 'Account', tableName: 'accounts', underscored: true, timestamps: false }
  );
  return Account;
}

test('generateNextRecurringExpenses cria a próxima despesa recorrente mensal uma única vez', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Expense = defineExpense(sequelize);
  defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Expense.create({
    user_id: 1,
    account_id: 10,
    description: 'Aluguel',
    value: 1500,
    due_date: '2026-01-10',
    category: 'Casa',
    status: 'paga',
    is_recurring: true,
    recurrence_id: 1,
  });

  const firstRun = await generateNextRecurringExpenses({ Expense });
  const secondRun = await generateNextRecurringExpenses({ Expense });

  assert.equal(firstRun.created, 1);
  assert.equal(secondRun.created, 0);

  const rows = await Expense.findAll({ where: { user_id: 1 }, order: [['due_date', 'ASC']] });
  assert.deepEqual(rows.map((x) => x.due_date), ['2026-01-10', '2026-02-10']);

  await sequelize.close();
});

test('stopRecurringExpenseSeriesFrom remove a ocorrência selecionada e impede recriação futura', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Expense = defineExpense(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 20, user_id: 2, name: 'Conta', balance: 3000 });

  await Expense.bulkCreate([
    {
      id: 1,
      user_id: 2,
      account_id: 20,
      description: 'Academia',
      value: 120,
      due_date: '2026-01-15',
      category: 'Saúde',
      status: 'paga',
      is_recurring: true,
      recurrence_id: 1,
    },
    {
      id: 2,
      user_id: 2,
      account_id: 20,
      description: 'Academia',
      value: 120,
      due_date: '2026-02-15',
      category: 'Saúde',
      status: 'pendente',
      is_recurring: true,
      recurrence_id: 1,
    },
  ]);

  const febExpense = await Expense.findByPk(2);
  const result = await stopRecurringExpenseSeriesFrom({ expense: febExpense, Expense, Account });
  assert.equal(result.deleted, 1);

  const janExpense = await Expense.findByPk(1);
  assert.equal(janExpense.recurrence_until, '2026-01-15');

  const afterDelete = await Expense.findAll({ where: { user_id: 2 }, order: [['due_date', 'ASC']] });
  assert.deepEqual(afterDelete.map((x) => x.due_date), ['2026-01-15']);

  const generateAgain = await generateNextRecurringExpenses({ Expense });
  assert.equal(generateAgain.created, 0);

  const finalRows = await Expense.findAll({ where: { user_id: 2 }, order: [['due_date', 'ASC']] });
  assert.deepEqual(finalRows.map((x) => x.due_date), ['2026-01-15']);

  await sequelize.close();
});

test('deleteRecurringExpenseOccurrenceOnly remove só a despesa selecionada e mantém as próximas', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Expense = defineExpense(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 30, user_id: 3, name: 'Conta', balance: 3000 });

  await Expense.bulkCreate([
    {
      id: 1,
      user_id: 3,
      account_id: 30,
      description: 'Academia',
      value: 120,
      due_date: '2026-01-15',
      category: 'Saúde',
      status: 'paga',
      is_recurring: true,
      recurrence_id: 1,
    },
    {
      id: 2,
      user_id: 3,
      account_id: 30,
      description: 'Academia',
      value: 120,
      due_date: '2026-02-15',
      category: 'Saúde',
      status: 'pendente',
      is_recurring: true,
      recurrence_id: 1,
    },
  ]);

  const febExpense = await Expense.findByPk(2);
  const result = await deleteRecurringExpenseOccurrenceOnly({ expense: febExpense, Expense, Account });
  assert.equal(result.deleted, 1);

  const generateAgain = await generateNextRecurringExpenses({ Expense });
  assert.equal(generateAgain.created, 1);

  const finalRows = await Expense.findAll({ where: { user_id: 3 }, order: [['due_date', 'ASC']] });
  assert.deepEqual(finalRows.map((x) => x.due_date), ['2026-01-15', '2026-03-15']);
  assert.equal(finalRows[0].recurrence_exceptions, JSON.stringify(['2026-02-15']));

  await sequelize.close();
});

test('deleteRecurringExpenseSeries remove toda a série de despesas recorrentes', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Expense = defineExpense(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 40, user_id: 4, name: 'Conta', balance: 3000 });

  await Expense.bulkCreate([
    {
      id: 1,
      user_id: 4,
      account_id: 40,
      description: 'Academia',
      value: 120,
      due_date: '2026-01-15',
      category: 'Saúde',
      status: 'paga',
      is_recurring: true,
      recurrence_id: 1,
    },
    {
      id: 2,
      user_id: 4,
      account_id: 40,
      description: 'Academia',
      value: 120,
      due_date: '2026-02-15',
      category: 'Saúde',
      status: 'pendente',
      is_recurring: true,
      recurrence_id: 1,
    },
  ]);

  const janExpense = await Expense.findByPk(1);
  const result = await deleteRecurringExpenseSeries({ expense: janExpense, Expense, Account });
  assert.equal(result.deleted, 2);

  const finalRows = await Expense.findAll({ where: { user_id: 4 } });
  assert.equal(finalRows.length, 0);

  await sequelize.close();
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes, Model } = require('sequelize');

const {
  deleteRecurringIncomeOccurrenceOnly,
  deleteRecurringIncomeSeries,
  ensureRecurringIncomesThrough,
  stopRecurringIncomeSeriesFrom
} = require('../src/services/recurringIncomes');

function defineIncome(sequelize) {
  class Income extends Model {}
  Income.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      account_id: { type: DataTypes.INTEGER, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      value: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: true },
      is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
      recurrence_id: { type: DataTypes.INTEGER, allowNull: true },
      recurrence_frequency: { type: DataTypes.STRING, allowNull: true },
      recurrence_interval: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
      recurrence_until: { type: DataTypes.DATEONLY, allowNull: true },
      recurrence_exceptions: { type: DataTypes.TEXT, allowNull: true },
      posted: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { sequelize, modelName: 'Income', tableName: 'incomes', underscored: true, timestamps: false }
  );
  return Income;
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

test('ensureRecurringIncomesThrough cria receitas mensais no próximo mês quando filtro aponta para próximo mês', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Income = defineIncome(sequelize);
  await sequelize.sync({ force: true });

  await Income.create({
    user_id: 1,
    account_id: 10,
    description: 'Salário',
    value: 5000,
    date: '2025-12-05',
    category: 'Salário',
    is_recurring: true,
    recurrence_frequency: 'monthly',
    recurrence_interval: 1,
    posted: true,
  });

  const now = new Date('2026-01-02T00:00:00Z');
  const r = await ensureRecurringIncomesThrough({ userId: 1, throughDate: '2026-02-28', Income, now });
  assert.equal(r.created, 2);

  const rows = await Income.findAll({ where: { user_id: 1 }, order: [['date', 'ASC']] });
  const dates = rows.map((x) => x.date);
  assert.deepEqual(dates, ['2025-12-05', '2026-01-05', '2026-02-05']);

  await sequelize.close();
});

test('ensureRecurringIncomesThrough suporta recorrência semanal', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Income = defineIncome(sequelize);
  await sequelize.sync({ force: true });

  await Income.create({
    user_id: 2,
    account_id: 20,
    description: 'Semanal',
    value: 100,
    date: '2026-01-01',
    category: 'Outros',
    is_recurring: true,
    recurrence_frequency: 'weekly',
    recurrence_interval: 1,
    posted: true,
  });

  const now = new Date('2026-01-02T00:00:00Z');
  const r = await ensureRecurringIncomesThrough({ userId: 2, throughDate: '2026-01-31', Income, now });
  assert.equal(r.created, 4);

  const rows = await Income.findAll({ where: { user_id: 2 }, order: [['date', 'ASC']] });
  const dates = rows.map((x) => x.date);
  assert.deepEqual(dates, ['2026-01-01', '2026-01-08', '2026-01-15', '2026-01-22', '2026-01-29']);

  await sequelize.close();
});

test('stopRecurringIncomeSeriesFrom remove a ocorrência selecionada e futuras sem recriar ao filtrar novamente', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Income = defineIncome(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 30, user_id: 3, name: 'Conta Principal', balance: 5000 });

  await Income.bulkCreate([
    {
      id: 1,
      user_id: 3,
      account_id: 30,
      description: 'Salário',
      value: 1000,
      date: '2026-01-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: true,
    },
    {
      id: 2,
      user_id: 3,
      account_id: 30,
      description: 'Salário',
      value: 1000,
      date: '2026-02-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: false,
    },
  ]);

  const feb = await Income.findByPk(2);
  const result = await stopRecurringIncomeSeriesFrom({ income: feb, Income, Account });
  assert.equal(result.deleted, 1);

  const afterDelete = await Income.findAll({ where: { user_id: 3 }, order: [['date', 'ASC']] });
  assert.deepEqual(afterDelete.map((x) => x.date), ['2026-01-05']);
  assert.equal(afterDelete[0].recurrence_until, '2026-01-05');

  const generateAgain = await ensureRecurringIncomesThrough({
    userId: 3,
    throughDate: '2026-02-28',
    Income,
    now: new Date('2026-02-01T00:00:00Z'),
  });
  assert.equal(generateAgain.created, 0);

  const finalRows = await Income.findAll({ where: { user_id: 3 }, order: [['date', 'ASC']] });
  assert.deepEqual(finalRows.map((x) => x.date), ['2026-01-05']);

  await sequelize.close();
});

test('deleteRecurringIncomeOccurrenceOnly remove só a ocorrência selecionada e mantém a série futura', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Income = defineIncome(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 40, user_id: 4, name: 'Conta Principal', balance: 4000 });

  await Income.bulkCreate([
    {
      id: 1,
      user_id: 4,
      account_id: 40,
      description: 'Salário',
      value: 1000,
      date: '2026-01-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: true,
    },
    {
      id: 2,
      user_id: 4,
      account_id: 40,
      description: 'Salário',
      value: 1000,
      date: '2026-02-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: false,
    },
  ]);

  const feb = await Income.findByPk(2);
  const result = await deleteRecurringIncomeOccurrenceOnly({ income: feb, Income, Account });
  assert.equal(result.deleted, 1);

  const generateAgain = await ensureRecurringIncomesThrough({
    userId: 4,
    throughDate: '2026-03-31',
    Income,
    now: new Date('2026-02-01T00:00:00Z'),
  });
  assert.equal(generateAgain.created, 1);

  const finalRows = await Income.findAll({ where: { user_id: 4 }, order: [['date', 'ASC']] });
  assert.deepEqual(finalRows.map((x) => x.date), ['2026-01-05', '2026-03-05']);
  assert.equal(finalRows[0].recurrence_exceptions, JSON.stringify(['2026-02-05']));

  await sequelize.close();
});

test('deleteRecurringIncomeSeries remove toda a série recorrente', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const Income = defineIncome(sequelize);
  const Account = defineAccount(sequelize);
  await sequelize.sync({ force: true });

  await Account.create({ id: 50, user_id: 5, name: 'Conta Principal', balance: 5000 });

  await Income.bulkCreate([
    {
      id: 1,
      user_id: 5,
      account_id: 50,
      description: 'Salário',
      value: 1000,
      date: '2026-01-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: true,
    },
    {
      id: 2,
      user_id: 5,
      account_id: 50,
      description: 'Salário',
      value: 1000,
      date: '2026-02-05',
      category: 'Salário',
      is_recurring: true,
      recurrence_id: 1,
      recurrence_frequency: 'monthly',
      recurrence_interval: 1,
      posted: false,
    },
  ]);

  const jan = await Income.findByPk(1);
  const result = await deleteRecurringIncomeSeries({ income: jan, Income, Account });
  assert.equal(result.deleted, 2);

  const finalRows = await Income.findAll({ where: { user_id: 5 } });
  assert.equal(finalRows.length, 0);

  await sequelize.close();
});

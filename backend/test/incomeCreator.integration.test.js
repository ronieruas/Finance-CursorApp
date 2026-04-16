const test = require('node:test');
const assert = require('node:assert/strict');
const { Sequelize, DataTypes, Model } = require('sequelize');

const { createIncome } = require('../src/services/incomeCreator');
const { normalizeFrequency, normalizeInterval, toISODateOnly } = require('../src/services/recurringIncomes');

function isEffective(dateInput) {
  if (!dateInput) return false;
  const [y, m, d] = String(dateInput).split('-').map(Number);
  const input = new Date(y, (m || 1) - 1, d || 1);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compare = new Date(input.getFullYear(), input.getMonth(), input.getDate());
  return compare <= today;
}

function defineModels(sequelize) {
  class Account extends Model {}
  Account.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      balance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      name: { type: DataTypes.STRING, allowNull: false },
    },
    { sequelize, modelName: 'Account', tableName: 'accounts', underscored: true, timestamps: false }
  );

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

  return { Account, Income };
}

test('createIncome cria receita recorrente mesmo com constraint is_recurring => recurrence_id not null', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const { Account, Income } = defineModels(sequelize);
  await sequelize.sync({ force: true });
  await sequelize.query('DROP TABLE incomes;');
  await sequelize.query(`
    CREATE TABLE incomes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      description VARCHAR(255) NOT NULL,
      value DECIMAL(14,2) NOT NULL,
      date DATE NOT NULL,
      category VARCHAR(255),
      is_recurring BOOLEAN DEFAULT 0,
      recurrence_id INTEGER,
      recurrence_frequency VARCHAR(255),
      recurrence_interval INTEGER DEFAULT 1,
      recurrence_until DATE,
      recurrence_exceptions TEXT,
      posted BOOLEAN DEFAULT 0,
      CHECK (is_recurring = 0 OR recurrence_id IS NOT NULL)
    );
  `);
  await Income.sync({ force: false });

  await Account.create({ id: 1, user_id: 1, name: 'Conta', balance: 0 });

  const { income, recurring } = await createIncome({
    userId: 1,
    body: { account_id: 1, description: 'Salário', value: 1000, date: '2026-04-10', category: 'Salário', is_recurring: true },
    Income,
    Account,
    FinancialAuditLog: null,
    sequelize,
    isEffective,
    normalizeFrequency,
    normalizeInterval,
    toISODateOnly,
    now: new Date('2026-04-10T12:00:00Z'),
  });

  assert.equal(recurring, true);
  assert.equal(income.is_recurring, true);
  assert.equal(income.recurrence_id, income.id);

  await sequelize.close();
});

test('createIncome falha com frequência inválida quando fornecida', async () => {
  const sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  const { Account, Income } = defineModels(sequelize);
  await sequelize.sync({ force: true });
  await Account.create({ id: 1, user_id: 1, name: 'Conta', balance: 0 });

  await assert.rejects(
    () =>
      createIncome({
        userId: 1,
        body: { account_id: 1, description: 'X', value: 10, date: '2026-04-10', is_recurring: true, recurrence_frequency: 'foo' },
        Income,
        Account,
        FinancialAuditLog: null,
        sequelize,
        isEffective,
        normalizeFrequency,
        normalizeInterval,
        toISODateOnly,
      }),
    (err) => err && err.message.includes('Frequência de recorrência inválida.')
  );

  await sequelize.close();
});


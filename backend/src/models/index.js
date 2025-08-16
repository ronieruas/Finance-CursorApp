const sequelize = require('../config/database');
const User = require('./user');
const Account = require('./account');
const Income = require('./income');
const Expense = require('./expense');
const CreditCard = require('./creditCard');

const Budget = require('./budget');
const Transfer = require('./transfer');
const CreditCardPayment = require('./creditCardPayment');
const Notification = require('./notification');

// Definir associações
User.hasMany(Account, { foreignKey: 'user_id', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Income, { foreignKey: 'user_id', as: 'incomes' });
Income.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Expense, { foreignKey: 'user_id', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(CreditCard, { foreignKey: 'user_id', as: 'creditCards' });
CreditCard.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Associações com Account
Account.hasMany(Income, { foreignKey: 'account_id', as: 'incomes' });
Income.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

Account.hasMany(Expense, { foreignKey: 'account_id', as: 'expenses' });
Expense.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

// Associações com CreditCard
CreditCard.hasMany(Expense, { foreignKey: 'credit_card_id', as: 'expenses' });
Expense.belongsTo(CreditCard, { foreignKey: 'credit_card_id', as: 'credit_card' });

CreditCard.hasMany(Budget, { foreignKey: 'credit_card_id', as: 'budgets' });
Budget.belongsTo(CreditCard, { foreignKey: 'credit_card_id', as: 'credit_card', required: false });

const syncDb = async () => {
  await sequelize.sync();
};

module.exports = {
  sequelize,
  User,
  Account,
  Income,
  Expense,
  CreditCard,

  Budget,
  Transfer,
  CreditCardPayment,
  Notification,
  syncDb,
};
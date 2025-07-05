const sequelize = require('../config/database');
const User = require('./user');
const Account = require('./account');
const Income = require('./income');
const Expense = require('./expense');
const CreditCard = require('./creditCard');
const CreditCardTransaction = require('./creditCardTransaction');
const Budget = require('./budget');
const Transfer = require('./transfer');

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
  CreditCardTransaction,
  Budget,
  Transfer,
  syncDb,
}; 
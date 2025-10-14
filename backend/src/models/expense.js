const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Expense extends Model {}

Expense.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    account_id: { type: DataTypes.INTEGER },
    credit_card_id: { type: DataTypes.INTEGER },
    installment_number: { type: DataTypes.INTEGER, defaultValue: 1 },
    installment_total: { type: DataTypes.INTEGER, defaultValue: 1 },
    description: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('paga', 'pendente', 'atrasada'), defaultValue: 'pendente' },
    is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
    auto_debit: { type: DataTypes.BOOLEAN, defaultValue: false },
    paid_at: { type: DataTypes.DATE },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Expense',
    tableName: 'expenses',
    underscored: true,
  }
);

module.exports = Expense;
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CreditCardPayment extends Model {}

CreditCardPayment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    card_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    payment_date: { type: DataTypes.DATEONLY, allowNull: false },
    is_full_payment: { type: DataTypes.BOOLEAN, defaultValue: true },
    auto_debit: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  {
    sequelize,
    modelName: 'CreditCardPayment',
    tableName: 'credit_card_payments',
    underscored: true,
  }
);

module.exports = CreditCardPayment; 
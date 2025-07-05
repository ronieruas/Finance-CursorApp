const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CreditCardTransaction extends Model {}

CreditCardTransaction.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    card_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING },
    installment_number: { type: DataTypes.INTEGER, defaultValue: 1 },
    installment_total: { type: DataTypes.INTEGER, defaultValue: 1 },
    family_member: { type: DataTypes.STRING },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'CreditCardTransaction',
    tableName: 'credit_card_transactions',
  }
);

module.exports = CreditCardTransaction; 
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class CreditCard extends Model {}

CreditCard.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    bank: { type: DataTypes.STRING },
    brand: { type: DataTypes.STRING },
    limit_value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    due_day: { type: DataTypes.INTEGER, allowNull: false },
    closing_day: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING },
    status: { type: DataTypes.ENUM('ativa', 'inativa'), defaultValue: 'ativa' },
    debito_automatico: { type: DataTypes.BOOLEAN, defaultValue: false },
    conta_debito_id: { type: DataTypes.INTEGER },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'CreditCard',
    tableName: 'credit_cards',
    underscored: true,
  }
);

module.exports = CreditCard; 
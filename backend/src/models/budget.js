const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Budget extends Model {}

Budget.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('geral', 'cartao'), allowNull: false },
    credit_card_id: { type: DataTypes.INTEGER, allowNull: true },
    period_start: { type: DataTypes.DATEONLY, allowNull: false },
    period_end: { type: DataTypes.DATEONLY, allowNull: false },
    planned_value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
  },
  {
    sequelize,
    modelName: 'Budget',
    tableName: 'budgets',
    underscored: true,
  }
);

module.exports = Budget;
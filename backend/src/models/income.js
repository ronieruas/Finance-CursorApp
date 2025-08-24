const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Income extends Model {}

Income.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    account_id: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: false },
    value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    category: { type: DataTypes.STRING },
    is_recurring: { type: DataTypes.BOOLEAN, defaultValue: false },
    posted: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Income',
    tableName: 'incomes',
    underscored: true,
  }
);

module.exports = Income;
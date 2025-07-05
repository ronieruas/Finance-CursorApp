const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Account extends Model {}

Account.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bank: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.ENUM('corrente', 'poupanca', 'investimento'),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(14,2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('ativa', 'inativa'),
      defaultValue: 'ativa',
    },
    currency: {
      type: DataTypes.ENUM('BRL', 'USD', 'EUR'),
      defaultValue: 'BRL',
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    underscored: true,
  }
);

module.exports = Account; 
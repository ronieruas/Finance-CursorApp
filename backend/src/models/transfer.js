const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Transfer extends Model {}

Transfer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    from_account_id: { 
      type: DataTypes.INTEGER, 
      allowNull: true // Permitir null para transferências de terceiros
    },
    to_account_id: { type: DataTypes.INTEGER, allowNull: true },
    value: { type: DataTypes.DECIMAL(14,2), allowNull: false },
    description: { type: DataTypes.STRING },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'Transfer',
    tableName: 'transfers',
    underscored: true,
  }
);

module.exports = Transfer; 
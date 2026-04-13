const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class FinancialAuditLog extends Model {}

FinancialAuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING, allowNull: false },
    entity_type: { type: DataTypes.STRING, allowNull: true },
    entity_id: { type: DataTypes.INTEGER, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'FinancialAuditLog',
    tableName: 'financial_audit_logs',
    underscored: true,
    timestamps: false,
  }
);

module.exports = FinancialAuditLog;


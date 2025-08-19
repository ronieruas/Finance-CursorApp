const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS || process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    timezone: process.env.TZ || 'America/Sao_Paulo',
    dialectOptions: {
      useUTC: false, // força leitura/escrita no fuso local
      dateStrings: true,
      typeCast: true
    }
  }
);

module.exports = sequelize;
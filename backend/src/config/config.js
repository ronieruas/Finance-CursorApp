const path = require('path');
require('dotenv').config();

const DIALECT = process.env.DB_DIALECT || 'postgres';
const isSqlite = DIALECT === 'sqlite';

module.exports = {
  development: isSqlite
    ? {
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || path.resolve(__dirname, '../../database.sqlite'),
        logging: false,
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASS || process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: DIALECT,
        logging: false,
      },
  test: isSqlite
    ? {
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || path.resolve(__dirname, '../../database.test.sqlite'),
        logging: false,
      }
    : {
        username: process.env.DB_USER,
        password: process.env.DB_PASS || process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: DIALECT,
        logging: false,
      },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
};
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente: prioriza backend/.env.local, depois .env na raiz
(() => {
  try {
    const candidates = [
      path.resolve(__dirname, '../../backend/.env.local'),
      path.resolve(__dirname, '../../.env'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        require('dotenv').config({ path: p });
        break;
      }
    }
  } catch (e) {
    // silenciosamente segue sem .env
  }
})();
const { Sequelize } = require('sequelize');

// Fallback: se não houver host configurado, usar sqlite em desenvolvimento
const DIALECT = process.env.DB_DIALECT || (process.env.DB_HOST ? 'postgres' : 'sqlite');

let sequelize;
if (DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || path.resolve(__dirname, '../../database.sqlite'),
    logging: false
  });
} else {
  sequelize = new Sequelize(
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
        typeCast: true,
      },
    }
  );
}

module.exports = sequelize;
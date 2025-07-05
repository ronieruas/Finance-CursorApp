require('dotenv').config({ path: './.env' }); // força o path local
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS);
const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    if (error.original) {
      console.error('Detalhe do erro original:', error.original);
    }
    process.exit(1);
  }
})();
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false
});

async function checkAccounts() {
  try {
    const accounts = await sequelize.query('SELECT id, name, bank, type, balance, currency, user_id, created_at FROM accounts ORDER BY created_at', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('Contas encontradas:', accounts.length);
    accounts.forEach(account => {
      console.log(`- ID: ${account.id}, Nome: ${account.name}, Banco: ${account.bank}, Tipo: ${account.type}, Saldo: ${account.balance}, Moeda: ${account.currency}, User ID: ${account.user_id}, Criada em: ${account.created_at}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

checkAccounts();
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false
});

async function checkUsers() {
  try {
    const users = await sequelize.query('SELECT id, email, name FROM users', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('Usuários encontrados:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

checkUsers();
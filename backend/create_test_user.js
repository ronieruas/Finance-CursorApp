require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });
const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false
});

async function createTestUser() {
  try {
    // Hash da senha "password"
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Atualizar o usuário existente com a senha hasheada
    await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, 'user@example.com'],
        type: sequelize.QueryTypes.UPDATE
      }
    );
    
    console.log('Usuário user@example.com atualizado com senha "password"');
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

createTestUser();
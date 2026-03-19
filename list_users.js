// Script para listar usuários existentes no banco

const sequelize = require('./backend/src/config/database');
const User = require('./backend/src/models/User');

async function listUsers() {
  try {
    console.log('📋 Listando usuários no banco de dados...\n');
    
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados.');
    } else {
      console.log(`✅ ${users.length} usuário(s) encontrado(s):\n`);
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        console.log(`Criado em: ${user.createdAt}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error.message);
  } finally {
    await sequelize.close();
  }
}

listUsers();
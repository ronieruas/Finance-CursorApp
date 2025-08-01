const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

async function waitForDatabase() {
  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: 'postgres',
    logging: false
  });

  const maxAttempts = 30;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    try {
      console.log(`Tentativa ${attempt}/${maxAttempts} - Conectando ao banco de dados...`);
      await sequelize.authenticate();
      console.log('✅ Conexão com banco de dados estabelecida!');
      await sequelize.close();
      return true;
    } catch (error) {
      console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);
      if (attempt === maxAttempts) {
        console.error('❌ Não foi possível conectar ao banco de dados após', maxAttempts, 'tentativas');
        return false;
      }
      console.log('Aguardando 2 segundos antes da próxima tentativa...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempt++;
    }
  }
}

// Se executado diretamente
if (require.main === module) {
  waitForDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = waitForDatabase; 
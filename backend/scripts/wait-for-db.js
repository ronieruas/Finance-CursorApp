const { Sequelize } = require('sequelize');

async function waitForDatabase() {
  // Usar variáveis de ambiente diretamente
  const config = {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USER || 'finance',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || 'finance123',
    database: process.env.DB_NAME || 'finance',
    dialect: 'postgres',
    logging: false
  };

  console.log('Configuração do banco:', {
    host: config.host,
    port: config.port,
    username: config.username,
    database: config.database
  });

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
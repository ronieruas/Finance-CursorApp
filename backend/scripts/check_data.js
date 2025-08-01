const { Sequelize } = require('sequelize');

const config = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'finance',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'finance123',
  database: process.env.DB_NAME || 'finance',
  dialect: 'postgres',
  logging: false
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false
});

async function checkData() {
  try {
    console.log('=== Verificando dados ===');
    
    // Verificar receitas
    const [incomes] = await sequelize.query('SELECT COUNT(*) as count FROM incomes');
    console.log('Receitas no banco:', incomes[0].count);
    
    if (incomes[0].count === 0) {
      console.log('Inserindo dados de teste...');
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      await sequelize.query(`
        INSERT INTO incomes (user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at)
        VALUES 
        (1, 1, 'Salário', 5000.00, '${primeiroDiaMes.toISOString().split('T')[0]}', 'Salário', false, NOW(), NOW()),
        (1, 1, 'Freelance', 1500.00, '${hoje.toISOString().split('T')[0]}', 'Trabalho Extra', false, NOW(), NOW()),
        (1, 1, 'Bônus', 800.00, '${hoje.toISOString().split('T')[0]}', 'Bônus', false, NOW(), NOW())
      `);
      console.log('Dados inseridos!');
    }
    
    // Verificar despesas
    const [expenses] = await sequelize.query('SELECT COUNT(*) as count FROM expenses');
    console.log('Despesas no banco:', expenses[0].count);
    
    // Verificar contas
    const [accounts] = await sequelize.query('SELECT COUNT(*) as count FROM accounts');
    console.log('Contas no banco:', accounts[0].count);
    
    if (accounts[0].count === 0) {
      console.log('Inserindo conta padrão...');
      await sequelize.query(`
        INSERT INTO accounts (user_id, name, balance, currency, status, created_at, updated_at)
        VALUES (1, 'Conta Principal', 10000.00, 'BRL', 'ativa', NOW(), NOW())
      `);
    }
    
    console.log('=== Verificação concluída ===');
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkData(); 
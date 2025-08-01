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

async function addTestIncomes() {
  try {
    console.log('=== Adicionando receitas de teste para julho ===');
    
    const hoje = new Date();
    // Ajustar para fuso horário brasileiro (UTC-3)
    const hojeBrasil = new Date(hoje.getTime() - (3 * 60 * 60 * 1000));
    const primeiroDiaMes = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth(), 1);
    const ultimoDiaMes = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth() + 1, 0);
    
    console.log('Período:', primeiroDiaMes.toISOString().split('T')[0], 'até', ultimoDiaMes.toISOString().split('T')[0]);
    console.log('Mês atual no Brasil:', hojeBrasil.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
    
    // Verificar se já existem receitas para julho
    const [existingIncomes] = await sequelize.query(`
      SELECT COUNT(*) as count FROM incomes 
      WHERE user_id = 2 
      AND date >= '${primeiroDiaMes.toISOString().split('T')[0]}'
      AND date <= '${ultimoDiaMes.toISOString().split('T')[0]}'
    `);
    
    console.log('Receitas existentes para julho:', existingIncomes[0].count);
    
    if (existingIncomes[0].count === 0) {
      console.log('Inserindo receitas de teste para julho...');
      
      await sequelize.query(`
        INSERT INTO incomes (user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at)
        VALUES 
        (2, 4, 'PCDF Julho', 13341.21, '${primeiroDiaMes.toISOString().split('T')[0]}', 'salario', true, NOW(), NOW()),
        (2, 4, 'Svg+GDF Julho', 3351.73, '${primeiroDiaMes.toISOString().split('T')[0]}', 'salario', false, NOW(), NOW()),
        (2, 4, 'Freelance Julho', 2500.00, '${hojeBrasil.toISOString().split('T')[0]}', 'trabalho_extra', false, NOW(), NOW())
      `);
      
      console.log('Receitas de teste inseridas com sucesso!');
    } else {
      console.log('Já existem receitas para julho. Pulando inserção.');
    }
    
    // Verificar receitas totais para julho
    const [totalIncomes] = await sequelize.query(`
      SELECT SUM(value) as total FROM incomes 
      WHERE user_id = 2 
      AND date >= '${primeiroDiaMes.toISOString().split('T')[0]}'
      AND date <= '${ultimoDiaMes.toISOString().split('T')[0]}'
    `);
    
    console.log('Total de receitas para julho:', totalIncomes[0].total);
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

addTestIncomes(); 
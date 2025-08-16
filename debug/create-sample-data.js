// Carregar dependências do backend
const path = require('path');
const { Sequelize } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'sequelize'));

const config = {
  host: process.env.DB_HOST || 'localhost',
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
  logging: console.log
});

async function createSampleData() {
  try {
    console.log('=== CRIANDO DADOS DE EXEMPLO ===\n');

    // 1. Verificar se já existem dados
    const [existingAccounts] = await sequelize.query('SELECT COUNT(*) as count FROM accounts WHERE user_id = 1');
    if (existingAccounts[0].count > 0) {
      console.log('❌ Dados já existem! Apagando dados existentes...');
      await sequelize.query('DELETE FROM expenses WHERE user_id = 1');
      await sequelize.query('DELETE FROM incomes WHERE user_id = 1');
      await sequelize.query('DELETE FROM budgets WHERE user_id = 1');
      await sequelize.query('DELETE FROM credit_cards WHERE user_id = 1');
      await sequelize.query('DELETE FROM accounts WHERE user_id = 1');
    }

    // 2. Criar contas
    console.log('📊 Criando contas...');
    await sequelize.query(`
      INSERT INTO accounts (user_id, name, bank, type, balance, currency, status, created_at, updated_at)
      VALUES 
        (1, 'Conta Corrente Principal', 'Banco do Brasil', 'corrente', 15000.00, 'BRL', 'ativa', NOW(), NOW()),
        (1, 'Conta Poupança', 'Caixa Econômica', 'poupanca', 5000.00, 'BRL', 'ativa', NOW(), NOW()),
        (1, 'Conta Investimentos', 'XP Investimentos', 'investimento', 25000.00, 'BRL', 'ativa', NOW(), NOW())
    `);

    // 3. Criar cartões de crédito
    console.log('💳 Criando cartões de crédito...');
    await sequelize.query(`
      INSERT INTO credit_cards (user_id, name, bank, brand, limit_value, used_limit, due_day, closing_day, status, debito_automatico, created_at, updated_at)
      VALUES 
        (1, 'Nubank Gold', 'Nubank', 'Mastercard', 8000.00, 0.00, 15, 10, 'ativo', true, NOW(), NOW()),
        (1, 'Santander Select', 'Santander', 'Visa', 12000.00, 0.00, 25, 20, 'ativo', false, NOW(), NOW()),
        (1, 'Inter Black', 'Inter', 'Mastercard', 5000.00, 0.00, 5, 1, 'ativo', true, NOW(), NOW())
    `);

    // 4. Criar receitas
    console.log('💰 Criando receitas...');
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    await sequelize.query(`
      INSERT INTO incomes (user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at)
      VALUES 
        (1, 1, 'Salário', 8500.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-05', 'Salário', true, NOW(), NOW()),
        (1, 1, 'Freelance Projeto A', 2500.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-15', 'Freelance', false, NOW(), NOW()),
        (1, 2, 'Rendimento Poupança', 125.50, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-01', 'Investimento', true, NOW(), NOW()),
        (1, 3, 'Dividendos', 450.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-20', 'Investimento', false, NOW(), NOW())
    `);

    // 5. Criar despesas de conta
    console.log('💸 Criando despesas de conta...');
    await sequelize.query(`
      INSERT INTO expenses (user_id, account_id, description, value, due_date, category, status, is_recurring, auto_debit, installment_number, installment_total, created_at, updated_at)
      VALUES 
        (1, 1, 'Aluguel', 2800.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-10', 'Moradia', 'paga', true, true, 1, 1, NOW(), NOW()),
        (1, 1, 'Conta de Luz', 180.50, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-12', 'Utilidades', 'paga', true, false, 1, 1, NOW(), NOW()),
        (1, 1, 'Conta de Água', 95.30, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-18', 'Utilidades', 'pendente', true, false, 1, 1, NOW(), NOW()),
        (1, 1, 'Internet', 120.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-22', 'Utilidades', 'pendente', true, true, 1, 1, NOW(), NOW()),
        (1, 1, 'Academia', 89.90, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-01', 'Saúde', 'paga', true, true, 1, 1, NOW(), NOW())
    `);

    // 6. Criar despesas de cartão
    console.log('🏪 Criando despesas de cartão...');
    await sequelize.query(`
      INSERT INTO expenses (user_id, credit_card_id, description, value, due_date, category, status, is_recurring, auto_debit, installment_number, installment_total, created_at, updated_at)
      VALUES 
        (1, 1, 'Supermercado Extra', 420.85, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-08', 'Alimentação', 'pendente', false, false, 1, 1, NOW(), NOW()),
        (1, 1, 'Posto de Gasolina', 280.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-14', 'Transporte', 'pendente', false, false, 1, 1, NOW(), NOW()),
        (1, 1, 'Netflix', 55.90, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-03', 'Entretenimento', 'pendente', true, true, 1, 1, NOW(), NOW()),
        (1, 2, 'Smartphone - Parcela 1/12', 250.00, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-25', 'Eletrônicos', 'pendente', false, false, 1, 12, NOW(), NOW()),
        (1, 2, 'Jantar Restaurante', 185.50, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-16', 'Alimentação', 'pendente', false, false, 1, 1, NOW(), NOW()),
        (1, 3, 'Farmácia Drogasil', 67.40, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-11', 'Saúde', 'pendente', false, false, 1, 1, NOW(), NOW()),
        (1, 3, 'Spotify', 21.90, '${currentYear}-${currentMonth.toString().padStart(2, '0')}-07', 'Entretenimento', 'pendente', true, true, 1, 1, NOW(), NOW())
    `);

    // 7. Criar orçamentos
    console.log('🎯 Criando orçamentos...');
    const firstDay = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    const lastDayStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDay}`;

    await sequelize.query(`
      INSERT INTO budgets (user_id, name, type, credit_card_id, period_start, period_end, planned_value, created_at, updated_at)
      VALUES 
        (1, 'Orçamento Geral Mensal', 'geral', NULL, '${firstDay}', '${lastDayStr}', 6000.00, NOW(), NOW()),
        (1, 'Orçamento Nubank', 'cartao', 1, '${firstDay}', '${lastDayStr}', 2000.00, NOW(), NOW()),
        (1, 'Orçamento Santander', 'cartao', 2, '${firstDay}', '${lastDayStr}', 3000.00, NOW(), NOW()),
        (1, 'Orçamento Inter', 'cartao', 3, '${firstDay}', '${lastDayStr}', 800.00, NOW(), NOW())
    `);

    // 8. Atualizar used_limit dos cartões
    console.log('🔄 Atualizando limites utilizados dos cartões...');
    
    // Cartão 1 (Nubank): Netflix + Supermercado + Gasolina = 756.75
    await sequelize.query('UPDATE credit_cards SET used_limit = 756.75 WHERE id = 1 AND user_id = 1');
    
    // Cartão 2 (Santander): Smartphone + Jantar = 435.50
    await sequelize.query('UPDATE credit_cards SET used_limit = 435.50 WHERE id = 2 AND user_id = 1');
    
    // Cartão 3 (Inter): Farmácia + Spotify = 89.30
    await sequelize.query('UPDATE credit_cards SET used_limit = 89.30 WHERE id = 3 AND user_id = 1');

    console.log('\n✅ DADOS DE EXEMPLO CRIADOS COM SUCESSO!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log('   - 3 contas bancárias');
    console.log('   - 3 cartões de crédito');
    console.log('   - 4 receitas');
    console.log('   - 5 despesas de conta');
    console.log('   - 7 despesas de cartão');
    console.log('   - 4 orçamentos');
    
    console.log('\n💰 Valores totais:');
    console.log('   - Receitas: R$ 11.575,50');
    console.log('   - Despesas conta: R$ 3.285,70');
    console.log('   - Despesas cartão: R$ 1.281,55');
    console.log('   - Saldo disponível nas contas: R$ 45.000,00');

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSampleData();
}

module.exports = { createSampleData };
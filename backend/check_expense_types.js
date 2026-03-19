const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finance_db',
  password: 'postgres',
  port: 5432,
});

async function checkExpenseTypes() {
  try {
    const result = await pool.query('SELECT id, description, type, account_id, credit_card_id FROM expenses ORDER BY id');
    
    console.log('=== TIPOS DE DESPESAS ===');
    console.log(`Despesas encontradas: ${result.rows.length}`);
    
    result.rows.forEach(expense => {
      console.log(`- ID: ${expense.id}, Descrição: ${expense.description}, Tipo: ${expense.type || 'NULL'}, Account ID: ${expense.account_id || 'NULL'}, Credit Card ID: ${expense.credit_card_id || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('Erro ao consultar despesas:', error);
  } finally {
    await pool.end();
  }
}

checkExpenseTypes();
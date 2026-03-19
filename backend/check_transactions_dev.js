require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false
});

async function checkTransactions() {
  try {
    // Verificar receitas
    const incomes = await sequelize.query('SELECT id, description, value, date, account_id, user_id, created_at FROM incomes ORDER BY created_at', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('=== RECEITAS ===');
    console.log('Receitas encontradas:', incomes.length);
    incomes.forEach(income => {
      console.log(`- ID: ${income.id}, Descrição: ${income.description}, Valor: ${income.value}, Data: ${income.date}, Account ID: ${income.account_id}, User ID: ${income.user_id}, Criada em: ${income.created_at}`);
    });
    
    // Verificar despesas
    const expenses = await sequelize.query('SELECT id, description, value, due_date, category, account_id, user_id, created_at FROM expenses ORDER BY created_at', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('\n=== DESPESAS ===');
    console.log('Despesas encontradas:', expenses.length);
    expenses.forEach(expense => {
      console.log(`- ID: ${expense.id}, Descrição: ${expense.description}, Valor: ${expense.value}, Data: ${expense.due_date}, Categoria: ${expense.category}, Account ID: ${expense.account_id}, User ID: ${expense.user_id}, Criada em: ${expense.created_at}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

checkTransactions();
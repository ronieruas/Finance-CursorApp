const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { Expense, Account, FinancialAuditLog, sequelize } = require('../models');
const { generateNextRecurringExpenses } = require('../services/recurringExpenses');
const { processExpensesAutomatic } = require('../services/expenseAutoProcessor');

async function processExpenses() {
  console.log('Iniciando processamento de despesas automáticas...');
  console.log(`[EXPENSES] TZ=${process.env.TZ || 'N/A'} | now=${new Date().toString()}`);
  const result = await processExpensesAutomatic({
    Expense,
    Account,
    FinancialAuditLog,
    sequelize,
    generateNextRecurringExpenses: () => generateNextRecurringExpenses({ Expense }),
    now: new Date(),
  });
  console.log(`[EXPENSES] Resultado: ${JSON.stringify(result)}`);
}


// Executar se chamado diretamente
if (require.main === module) {
  processExpenses().then(() => {
    console.log('Script finalizado');
    process.exit(0);
  }).catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
}

module.exports = { processExpenses };

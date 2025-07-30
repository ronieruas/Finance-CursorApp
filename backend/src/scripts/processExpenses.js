const { Expense, Account } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

async function processExpenses() {
  try {
    console.log('Iniciando processamento de despesas automáticas...');
    
    // 1. Processar despesas pendentes com data de pagamento futura que chegou
    const today = new Date();
    const pendingExpenses = await Expense.findAll({
      where: {
        status: 'pendente',
        paid_at: {
          [Op.lte]: today
        },
        account_id: {
          [Op.ne]: null
        }
      }
    });

    console.log(`Encontradas ${pendingExpenses.length} despesas pendentes para processar`);

    for (const expense of pendingExpenses) {
      try {
        // Atualizar status para paga
        await expense.update({
          status: 'paga',
          paid_at: expense.paid_at || today
        });

        // Debitar da conta
        const account = await Account.findOne({
          where: { id: expense.account_id, user_id: expense.user_id }
        });

        if (account) {
          account.balance = Number(account.balance) - Number(expense.value);
          await account.save();
          console.log(`Despesa ${expense.id} processada - debitado R$ ${expense.value} da conta ${account.name}`);
        }
      } catch (err) {
        console.error(`Erro ao processar despesa ${expense.id}:`, err.message);
      }
    }

    // 2. Processar despesas recorrentes
    const recurringExpenses = await Expense.findAll({
      where: {
        is_recurring: true,
        status: 'paga',
        account_id: {
          [Op.ne]: null
        }
      }
    });

    console.log(`Encontradas ${recurringExpenses.length} despesas recorrentes para verificar`);

    for (const expense of recurringExpenses) {
      try {
        const lastDueDate = dayjs(expense.due_date);
        const nextDueDate = lastDueDate.add(1, 'month');
        
        // Verificar se já existe uma despesa para o próximo mês
        const existingExpense = await Expense.findOne({
          where: {
            user_id: expense.user_id,
            account_id: expense.account_id,
            description: expense.description,
            due_date: {
              [Op.between]: [
                nextDueDate.startOf('month').toDate(),
                nextDueDate.endOf('month').toDate()
              ]
            }
          }
        });

        if (!existingExpense) {
          // Criar nova despesa para o próximo mês
          const newExpense = await Expense.create({
            user_id: expense.user_id,
            account_id: expense.account_id,
            description: expense.description,
            value: expense.value,
            due_date: nextDueDate.toDate(),
            category: expense.category,
            status: 'pendente',
            is_recurring: true,
            auto_debit: expense.auto_debit,
            installment_number: expense.installment_number,
            installment_total: expense.installment_total
          });

          console.log(`Nova despesa recorrente criada: ${newExpense.id} - ${newExpense.description} - Vencimento: ${nextDueDate.format('DD/MM/YYYY')}`);
        }
      } catch (err) {
        console.error(`Erro ao processar despesa recorrente ${expense.id}:`, err.message);
      }
    }

    console.log('Processamento de despesas automáticas concluído!');
  } catch (err) {
    console.error('Erro no processamento de despesas automáticas:', err);
  }
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
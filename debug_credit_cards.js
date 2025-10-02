const { CreditCard, Expense } = require('./backend/src/models');
const dayjs = require('dayjs');

async function debugCreditCards() {
  try {
    console.log('=== DEBUG CARTÕES DE CRÉDITO ===\n');
    
    // Buscar cartões com fechamento no dia 28
    const cards = await CreditCard.findAll({
      where: { closing_day: 28 }
    });
    
    console.log(`Encontrados ${cards.length} cartões com fechamento no dia 28:`);
    
    for (const card of cards) {
      console.log(`\n--- Cartão: ${card.name} (${card.bank}) ---`);
      console.log(`ID: ${card.id}`);
      console.log(`Fechamento: dia ${card.closing_day}`);
      console.log(`Vencimento: dia ${card.due_day}`);
      console.log(`Status: ${card.status}`);
      console.log(`Criado em: ${card.createdAt}`);
      console.log(`Atualizado em: ${card.updatedAt}`);
      
      // Verificar despesas do cartão
      const expenses = await Expense.findAll({
        where: { credit_card_id: card.id },
        order: [['due_date', 'DESC']],
        limit: 10
      });
      
      console.log(`\nÚltimas ${expenses.length} despesas do cartão:`);
      expenses.forEach(expense => {
        console.log(`  - ${expense.description}: R$ ${expense.value} (Vencimento: ${expense.due_date}, Status: ${expense.status})`);
      });
      
      // Calcular período da fatura atual
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = hoje.getMonth(); // 0-11
      const dia = hoje.getDate();
      
      console.log(`\nData atual: ${dia}/${mes + 1}/${ano}`);
      
      // Lógica de fechamento baseada no controller
      let dueYearAtual = ano;
      let dueMonthAtual;
      if (dia > card.due_day) {
        // Já passou do vencimento deste mês -> fatura atual é a do próximo mês
        dueMonthAtual = mes + 1;
        if (dueMonthAtual > 11) { dueMonthAtual = 0; dueYearAtual += 1; }
      } else {
        // Ainda não passou do vencimento -> fatura atual é a que vence neste mês
        dueMonthAtual = mes;
      }
      
      console.log(`Fatura atual vence em: ${card.due_day}/${dueMonthAtual + 1}/${dueYearAtual}`);
      
      // Calcular período da fatura
      let start, end;
      if (card.closing_day > card.due_day) {
        // Fechamento ocorre no mês anterior ao vencimento
        start = new Date(dueYearAtual, dueMonthAtual - 2, card.closing_day);
        end = new Date(dueYearAtual, dueMonthAtual - 1, card.closing_day - 1);
      } else {
        // Fechamento ocorre no mesmo mês do vencimento
        start = new Date(dueYearAtual, dueMonthAtual - 1, card.closing_day);
        end = new Date(dueYearAtual, dueMonthAtual, card.closing_day - 1);
      }
      
      console.log(`Período da fatura atual: ${start.getDate()}/${start.getMonth() + 1}/${start.getFullYear()} até ${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`);
      
      // Verificar se a fatura deveria estar fechada
      const dataFechamento = new Date(dueYearAtual, dueMonthAtual - 1, card.closing_day);
      if (card.closing_day > card.due_day) {
        dataFechamento.setMonth(dataFechamento.getMonth() - 1);
      }
      
      console.log(`Data de fechamento da fatura atual: ${dataFechamento.getDate()}/${dataFechamento.getMonth() + 1}/${dataFechamento.getFullYear()}`);
      
      const jaFechou = hoje >= dataFechamento;
      console.log(`Fatura já deveria estar fechada? ${jaFechou ? 'SIM' : 'NÃO'}`);
      
      if (jaFechou) {
        console.log('⚠️  PROBLEMA IDENTIFICADO: Fatura deveria estar fechada mas ainda aparece como aberta!');
      }
    }
    
  } catch (error) {
    console.error('Erro ao debugar cartões:', error);
  }
}

debugCreditCards().then(() => {
  console.log('\n=== DEBUG CONCLUÍDO ===');
  process.exit(0);
}).catch(console.error);
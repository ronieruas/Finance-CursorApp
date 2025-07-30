const { Budget, Expense, CreditCard } = require('../models');
const { Op } = require('sequelize');

async function testBudgetCalculation() {
  console.log('=== TESTE DE CÁLCULO DE ORÇAMENTOS ===\n');
  
  // Simular um usuário (substitua pelo ID real do usuário)
  const userId = 1; // Ajuste conforme necessário
  
  // Buscar orçamentos do usuário
  const budgets = await Budget.findAll({ where: { user_id: userId } });
  
  console.log(`Encontrados ${budgets.length} orçamentos:\n`);
  
  for (const budget of budgets) {
    console.log(`--- Orçamento: ${budget.name} ---`);
    console.log(`Tipo: ${budget.type}`);
    console.log(`Período: ${budget.period_start} a ${budget.period_end}`);
    console.log(`Valor planejado: R$ ${Number(budget.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Credit Card ID: ${budget.credit_card_id || 'N/A'}`);
    
    // Calcular valor utilizado manualmente
    let utilizado = 0;
    let queryDetails = '';
    
    if (budget.type === 'geral') {
      utilizado = await Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        },
      });
      queryDetails = 'Todas as despesas do período';
    } else if (budget.type === 'cartao') {
      // Se tem credit_card_id específico, filtrar por esse cartão
      const whereClause = {
        user_id: userId,
        due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        credit_card_id: { [Op.ne]: null },
      };
      
      if (budget.credit_card_id) {
        whereClause.credit_card_id = budget.credit_card_id;
        queryDetails = `Apenas despesas do cartão ID ${budget.credit_card_id} no período`;
      } else {
        queryDetails = 'Apenas despesas de cartão do período (sem cartão específico)';
      }
      
      utilizado = await Expense.sum('value', { where: whereClause });
    }
    
    console.log(`Query: ${queryDetails}`);
    console.log(`Valor utilizado calculado: R$ ${Number(utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    // Buscar despesas detalhadas para debug
    const expenses = await Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        ...(budget.type === 'cartao' ? { 
          credit_card_id: budget.credit_card_id ? budget.credit_card_id : { [Op.ne]: null }
        } : {})
      },
      include: [
        { model: CreditCard, as: 'credit_card', attributes: ['name'] }
      ],
      order: [['due_date', 'ASC']]
    });
    
    console.log(`\nDespesas encontradas (${expenses.length}):`);
    expenses.forEach(exp => {
      const cardName = exp.credit_card ? exp.credit_card.name : 'Conta';
      console.log(`  - ${exp.due_date}: R$ ${Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${cardName})`);
    });
    
    // Verificar se há duplicação
    const totalManual = expenses.reduce((sum, exp) => sum + parseFloat(exp.value), 0);
    console.log(`\nSoma manual: R$ ${Number(totalManual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Soma via SUM(): R$ ${Number(utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    if (Math.abs(totalManual - utilizado) > 0.01) {
      console.log('❌ DIFERENÇA ENCONTRADA!');
    } else {
      console.log('✅ Valores coincidem');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// Executar o teste
if (require.main === module) {
  testBudgetCalculation()
    .then(() => {
      console.log('Teste concluído');
      process.exit(0);
    })
    .catch(err => {
      console.error('Erro no teste:', err);
      process.exit(1);
    });
}

module.exports = { testBudgetCalculation }; 
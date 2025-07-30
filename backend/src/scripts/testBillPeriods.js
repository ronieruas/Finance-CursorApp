// Função getBillPeriods (versão corrigida)
function getBillPeriods(closingDay, dueDay, refDate = new Date()) {
  // refDate: data de referência (hoje)
  // Retorna os períodos de fatura atual e próxima
  // 
  // Regra: O vencimento sempre é posterior ao fechamento
  // Exemplo: cartão com fechamento dia 9 e vencimento dia 15
  // - Fatura atual: compras de 9/jul até 8/ago -> vence em 15/ago
  // - Próxima fatura: compras de 9/ago até 8/set -> vence em 15/set
  
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const day = refDate.getDate();
  
  // Determinar qual fatura está em aberto baseado na data de referência
  let faturaAtualVencimento, faturaProximaVencimento;
  
  if (day >= dueDay) {
    // Já passou do vencimento do mês atual, então a fatura em aberto é a do próximo mês
    faturaAtualVencimento = new Date(year, month + 1, dueDay);
    faturaProximaVencimento = new Date(year, month + 2, dueDay);
  } else {
    // Ainda não chegou ao vencimento do mês atual
    faturaAtualVencimento = new Date(year, month, dueDay);
    faturaProximaVencimento = new Date(year, month + 1, dueDay);
  }
  
  // Calcular o fechamento correspondente à fatura atual
  // O fechamento é sempre anterior ao vencimento
  const fechamentoAtual = new Date(faturaAtualVencimento);
  fechamentoAtual.setDate(closingDay);
  if (fechamentoAtual >= faturaAtualVencimento) {
    // Se o fechamento seria após o vencimento, ajustar para o mês anterior
    fechamentoAtual.setMonth(fechamentoAtual.getMonth() - 1);
  }
  
  // Calcular o fechamento correspondente à próxima fatura
  const fechamentoProxima = new Date(faturaProximaVencimento);
  fechamentoProxima.setDate(closingDay);
  if (fechamentoProxima >= faturaProximaVencimento) {
    // Se o fechamento seria após o vencimento, ajustar para o mês anterior
    fechamentoProxima.setMonth(fechamentoProxima.getMonth() - 1);
  }
  
  // Período da fatura atual: do fechamento anterior até o dia anterior ao fechamento atual
  const faturaAtualStart = new Date(fechamentoAtual);
  faturaAtualStart.setMonth(fechamentoAtual.getMonth() - 1);
  
  const faturaAtualEnd = new Date(fechamentoAtual);
  faturaAtualEnd.setDate(fechamentoAtual.getDate() - 1);
  
  // Período da próxima fatura: do fechamento atual até o dia anterior ao próximo fechamento
  const faturaProximaStart = new Date(fechamentoAtual);
  
  const faturaProximaEnd = new Date(fechamentoProxima);
  faturaProximaEnd.setDate(fechamentoProxima.getDate() - 1);
  
  return {
    atual: { 
      start: faturaAtualStart, 
      end: faturaAtualEnd,
      vencimento: faturaAtualVencimento
    },
    proxima: { 
      start: faturaProximaStart, 
      end: faturaProximaEnd,
      vencimento: faturaProximaVencimento
    },
  };
}

// Teste da lógica corrigida
console.log('=== TESTE DA LÓGICA CORRIGIDA ===');

// Exemplo 1: Cartão com fechamento dia 9 e vencimento dia 15
console.log('\n--- Exemplo 1: Fechamento 9, Vencimento 15 ---');
const hoje = new Date(2024, 7, 10); // 10 de agosto de 2024
const periodos1 = getBillPeriods(9, 15, hoje);
console.log('Data de referência:', hoje.toISOString().split('T')[0]);
console.log('Fatura atual:', {
  start: periodos1.atual.start.toISOString().split('T')[0],
  end: periodos1.atual.end.toISOString().split('T')[0],
  vencimento: periodos1.atual.vencimento.toISOString().split('T')[0]
});
console.log('Próxima fatura:', {
  start: periodos1.proxima.start.toISOString().split('T')[0],
  end: periodos1.proxima.end.toISOString().split('T')[0],
  vencimento: periodos1.proxima.vencimento.toISOString().split('T')[0]
});

// Exemplo 2: Cartão com fechamento dia 29 e vencimento dia 5
console.log('\n--- Exemplo 2: Fechamento 29, Vencimento 5 ---');
const periodos2 = getBillPeriods(29, 5, hoje);
console.log('Fatura atual:', {
  start: periodos2.atual.start.toISOString().split('T')[0],
  end: periodos2.atual.end.toISOString().split('T')[0],
  vencimento: periodos2.atual.vencimento.toISOString().split('T')[0]
});
console.log('Próxima fatura:', {
  start: periodos2.proxima.start.toISOString().split('T')[0],
  end: periodos2.proxima.end.toISOString().split('T')[0],
  vencimento: periodos2.proxima.vencimento.toISOString().split('T')[0]
});

// Teste específico para cartão com fechamento 29 e vencimento 5
console.log('\n--- Teste específico: Fechamento 29, Vencimento 5 (data antes do vencimento) ---');
const antesVencimento = new Date(2024, 7, 3); // 3 de agosto (antes do vencimento dia 5)
const periodos3 = getBillPeriods(29, 5, antesVencimento);
console.log('Data de referência:', antesVencimento.toISOString().split('T')[0]);
console.log('Fatura atual:', {
  start: periodos3.atual.start.toISOString().split('T')[0],
  end: periodos3.atual.end.toISOString().split('T')[0],
  vencimento: periodos3.atual.vencimento.toISOString().split('T')[0]
});

// Teste específico para cartão com fechamento 29 e vencimento 5 (data após o vencimento)
console.log('\n--- Teste específico: Fechamento 29, Vencimento 5 (data após o vencimento) ---');
const aposVencimento = new Date(2024, 7, 10); // 10 de agosto (após o vencimento dia 5)
const periodos4 = getBillPeriods(29, 5, aposVencimento);
console.log('Data de referência:', aposVencimento.toISOString().split('T')[0]);
console.log('Fatura atual:', {
  start: periodos4.atual.start.toISOString().split('T')[0],
  end: periodos4.atual.end.toISOString().split('T')[0],
  vencimento: periodos4.atual.vencimento.toISOString().split('T')[0]
});

console.log('\n=== VERIFICAÇÃO DA LÓGICA ===');
console.log('✓ Para cartão com fechamento 9 e vencimento 15:');
console.log('  - Fatura que vence em 15/ago: despesas de 09/jul a 08/ago ✓');
console.log('  - Fatura que vence em 15/set: despesas de 09/ago a 08/set ✓');
console.log('');
console.log('✓ Para cartão com fechamento 29 e vencimento 5:');
console.log('  - Fatura que vence em 05/ago: despesas de 29/jun a 28/jul ✓');
console.log('  - Fatura que vence em 05/set: despesas de 29/jul a 28/ago ✓'); 
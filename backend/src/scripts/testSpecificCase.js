// Teste específico para o cenário do usuário
function testSpecificCase() {
  console.log('=== TESTE ESPECÍFICO - CENÁRIO DO USUÁRIO ===\n');
  
  // Cenário: hoje é 26/07/2025, cartão com fechamento dia 29 e vencimento dia 5
  const today = new Date(2025, 6, 26); // 26 de julho de 2025
  const closingDay = 29;
  const dueDay = 5;
  
  console.log(`Data de referência: ${today.toLocaleDateString('pt-BR')}`);
  console.log(`Cartão: fechamento dia ${closingDay}, vencimento dia ${dueDay}\n`);
  
  // Testar a função getBillPeriods
  const periods = getBillPeriods(closingDay, dueDay, today);
  
  console.log('RESULTADO DA FUNÇÃO getBillPeriods:');
  console.log('  Fatura atual:');
  console.log(`    Início: ${periods.atual.start.toLocaleDateString('pt-BR')}`);
  console.log(`    Fim: ${periods.atual.end.toLocaleDateString('pt-BR')}`);
  console.log('  Próxima fatura:');
  console.log(`    Início: ${periods.proxima.start.toLocaleDateString('pt-BR')}`);
  console.log(`    Fim: ${periods.proxima.end.toLocaleDateString('pt-BR')}\n`);
  
  // Testar uma compra feita hoje (26/07/2025)
  const compraHoje = new Date(2025, 6, 26);
  console.log(`Teste: Compra feita em ${compraHoje.toLocaleDateString('pt-BR')}`);
  
  const estaNaFaturaAtual = compraHoje >= periods.atual.start && compraHoje <= periods.atual.end;
  const estaNaProximaFatura = compraHoje >= periods.proxima.start && compraHoje <= periods.proxima.end;
  
  console.log(`  Está na fatura atual? ${estaNaFaturaAtual}`);
  console.log(`  Está na próxima fatura? ${estaNaProximaFatura}\n`);
  
  // Explicação do que deveria acontecer
  console.log('EXPLICAÇÃO DO QUE DEVERIA ACONTECER:');
  console.log('- Hoje é 26/07/2025');
  console.log('- O cartão fecha em 29/07/2025');
  console.log('- A compra de hoje (26/07) deveria estar na fatura que fecha em 29/07');
  console.log('- Essa fatura vence em 05/08/2025');
  console.log('- Portanto, a compra deveria estar na fatura de agosto, não de julho\n');
  
  // Verificar se a lógica está correta
  if (estaNaProximaFatura && !estaNaFaturaAtual) {
    console.log('✅ CORRETO: A compra está na fatura de agosto (próxima fatura)');
  } else if (estaNaFaturaAtual && !estaNaProximaFatura) {
    console.log('❌ INCORRETO: A compra está na fatura de julho (fatura atual)');
  } else {
    console.log('❓ INDEFINIDO: A compra está em ambas as faturas ou em nenhuma');
  }
}

// Função getBillPeriods (cópia da função do controller)
function getBillPeriods(closingDay, dueDay, refDate = new Date()) {
  // refDate: data de referência (hoje)
  // Retorna os períodos de fatura atual e próxima
  // 
  // Exemplo: cartão com fechamento dia 28 e vencimento dia 5
  // - Fatura atual: compras de 28/jun até 27/jul -> vence em 5/ago
  // - Próxima fatura: compras de 28/jul até 27/ago -> vence em 5/set
  
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  
  // Calcular o fechamento da fatura atual
  // Se hoje é antes do fechamento do mês atual, a fatura atual fecha no mês anterior
  let currentClosing = new Date(year, month, closingDay);
  if (refDate.getDate() < closingDay) {
    // Ainda não fechou a fatura do mês atual, então a fatura atual é do mês anterior
    currentClosing = new Date(year, month - 1, closingDay);
  }
  
  // Período da fatura atual: do fechamento do mês anterior até o dia anterior ao fechamento atual
  const faturaAtualStart = new Date(currentClosing);
  faturaAtualStart.setMonth(currentClosing.getMonth() - 1);
  
  const faturaAtualEnd = new Date(currentClosing);
  faturaAtualEnd.setDate(currentClosing.getDate() - 1);
  
  // Período da próxima fatura: do fechamento atual até o dia anterior ao próximo fechamento
  const faturaProximaStart = new Date(currentClosing);
  
  const faturaProximaEnd = new Date(currentClosing);
  faturaProximaEnd.setMonth(currentClosing.getMonth() + 1);
  faturaProximaEnd.setDate(currentClosing.getDate() - 1);
  
  return {
    atual: { start: faturaAtualStart, end: faturaAtualEnd },
    proxima: { start: faturaProximaStart, end: faturaProximaEnd },
  };
}

// Executar o teste
if (require.main === module) {
  testSpecificCase();
}

module.exports = { testSpecificCase, getBillPeriods }; 
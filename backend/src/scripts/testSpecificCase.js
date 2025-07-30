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
  console.log(`    Vencimento: ${periods.atual.vencimento.toLocaleDateString('pt-BR')}`);
  console.log('  Próxima fatura:');
  console.log(`    Início: ${periods.proxima.start.toLocaleDateString('pt-BR')}`);
  console.log(`    Fim: ${periods.proxima.end.toLocaleDateString('pt-BR')}`);
  console.log(`    Vencimento: ${periods.proxima.vencimento.toLocaleDateString('pt-BR')}\n`);
  
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
  console.log('- Portanto, a compra deveria estar na fatura que vence em 05/08\n');
  
  // Verificar se a lógica está correta
  if (estaNaFaturaAtual && !estaNaProximaFatura) {
    console.log('✅ CORRETO: A compra está na fatura que vence em 05/08 (fatura atual)');
    console.log('   - Período: 29/06 a 28/07');
    console.log('   - Vencimento: 05/08');
  } else if (estaNaProximaFatura && !estaNaFaturaAtual) {
    console.log('❌ INCORRETO: A compra está na próxima fatura');
  } else {
    console.log('❓ INDEFINIDO: A compra está em ambas as faturas ou em nenhuma');
  }
}

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

// Executar o teste
if (require.main === module) {
  testSpecificCase();
}

module.exports = { testSpecificCase, getBillPeriods }; 
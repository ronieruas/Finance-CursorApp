const { CreditCard } = require('../models');

// Função para testar o cálculo de períodos de fatura
function testBillPeriods() {
  console.log('=== TESTE DE CÁLCULO DE PERÍODOS DE FATURA ===\n');
  
  // Exemplo: cartão com fechamento dia 28 e vencimento dia 5
  const closingDay = 28;
  const dueDay = 5;
  
  // Testar diferentes datas de referência
  const testDates = [
    new Date(2024, 6, 15), // 15 de julho de 2024
    new Date(2024, 6, 28), // 28 de julho de 2024 (dia do fechamento)
    new Date(2024, 6, 29), // 29 de julho de 2024 (após fechamento)
    new Date(2024, 7, 5),  // 5 de agosto de 2024 (dia do vencimento)
  ];
  
  testDates.forEach((testDate, index) => {
    console.log(`Teste ${index + 1}: Data de referência ${testDate.toLocaleDateString('pt-BR')}`);
    
    // Calcular períodos usando a nova lógica
    const periods = getBillPeriods(closingDay, dueDay, testDate);
    
    console.log('  Fatura atual:');
    console.log(`    Início: ${periods.atual.start.toLocaleDateString('pt-BR')}`);
    console.log(`    Fim: ${periods.atual.end.toLocaleDateString('pt-BR')}`);
    console.log('  Próxima fatura:');
    console.log(`    Início: ${periods.proxima.start.toLocaleDateString('pt-BR')}`);
    console.log(`    Fim: ${periods.proxima.end.toLocaleDateString('pt-BR')}`);
    console.log('');
  });
  
  // Testar cálculo para mês específico
  console.log('=== TESTE DE CÁLCULO PARA MÊS ESPECÍFICO ===\n');
  
  const testMonths = [
    { year: 2024, month: 6 }, // Julho 2024
    { year: 2024, month: 7 }, // Agosto 2024
    { year: 2024, month: 8 }, // Setembro 2024
  ];
  
  testMonths.forEach(({ year, month }, index) => {
    console.log(`Teste mês ${index + 1}: ${new Date(year, month).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}`);
    
    const period = getBillPeriodForMonth(closingDay, year, month);
    
    console.log(`  Período da fatura:`);
    console.log(`    Início: ${period.start.toLocaleDateString('pt-BR')}`);
    console.log(`    Fim: ${period.end.toLocaleDateString('pt-BR')}`);
    console.log('');
  });
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

// Função getBillPeriodForMonth (cópia da função do controller)
function getBillPeriodForMonth(closingDay, year, month) {
  // Calcula o período da fatura para um mês específico
  // month: 0-11 (janeiro = 0, dezembro = 11)
  // year: ano completo
  
  // Fechamento da fatura para o mês especificado
  const closingDate = new Date(year, month, closingDay);
  
  // Período da fatura: do fechamento do mês anterior até o dia anterior ao fechamento atual
  const start = new Date(closingDate);
  start.setMonth(closingDate.getMonth() - 1);
  
  const end = new Date(closingDate);
  end.setDate(closingDate.getDate() - 1);
  
  return { start, end };
}

// Executar o teste
if (require.main === module) {
  testBillPeriods();
}

module.exports = { testBillPeriods, getBillPeriods, getBillPeriodForMonth }; 
const { Account, Income, Expense, CreditCard, CreditCardTransaction, Budget } = require('../models');
const { Op } = require('sequelize');

// Helpers alinhados ao dashboard para períodos de fatura
function formatDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const getBillPeriodForMonth = (closingDay, dueDay, year, month) => {
  const vencimento = new Date(year, month, dueDay);
  let start;
  let end;
  if (closingDay > dueDay) {
    start = new Date(year, month - 2, closingDay);
    start.setHours(0, 0, 0, 0);
    end = new Date(year, month - 1, closingDay - 1);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(year, month - 1, closingDay);
    start.setHours(0, 0, 0, 0);
    end = new Date(year, month, closingDay - 1);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end, vencimento };
};

function getBillPeriodsFromRef(closingDay, dueDay, refDate = new Date()) {
  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const day = refDate.getDate();
  let dueYearAtual = year;
  let dueMonthAtual;
  if (day > dueDay) {
    dueMonthAtual = month + 1;
    if (dueMonthAtual > 11) { dueMonthAtual = 0; dueYearAtual += 1; }
  } else {
    dueMonthAtual = month;
  }
  let dueYearProxima = dueYearAtual;
  let dueMonthProxima = dueMonthAtual + 1;
  if (dueMonthProxima > 11) { dueMonthProxima = 0; dueYearProxima += 1; }
  const atual = getBillPeriodForMonth(closingDay, dueDay, dueYearAtual, dueMonthAtual);
  const proxima = getBillPeriodForMonth(closingDay, dueDay, dueYearProxima, dueMonthProxima);
  return { atual, proxima };
}

exports.getResumo = async (req, res) => {
  try {
    console.log('Resumo: início da requisição');
    const userId = req.user.id;
    
    // Período atual (mês atual no Brasil)
    const hoje = new Date();
    // Ajustar para fuso horário brasileiro (UTC-3)
    const hojeBrasil = new Date(hoje.getTime() - (3 * 60 * 60 * 1000));
    const primeiroDiaMes = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth(), 1);
    const ultimoDiaMes = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth() + 1, 0);
    
    console.log('Período de consulta:', {
      primeiroDiaMes: primeiroDiaMes.toISOString(),
      ultimoDiaMes: ultimoDiaMes.toISOString(),
      userId: userId,
      mesAtual: hojeBrasil.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
    
    // 1. Receitas do Mês - Buscar todas as receitas do mês atual
    const receitasMes = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
      },
    }) || 0;

    console.log('Receitas do mês:', receitasMes);

    // Se não há receitas no mês atual, buscar receitas recorrentes do mês anterior
    if (receitasMes === 0) {
      const receitasRecorrentes = await Income.sum('value', {
        where: {
          user_id: userId,
          is_recurring: true,
          date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
        },
      }) || 0;
      
      console.log('Receitas recorrentes do mês:', receitasRecorrentes);
    }

    // 2. Saldo por Conta
    const contas = await Account.findAll({
      where: { 
        user_id: userId, 
        status: 'ativa',
        currency: { [Op.or]: [null, 'BRL'] }
      },
      attributes: ['id', 'name', 'balance']
    });
    
    const saldoPorConta = contas.map(conta => ({
      nome: conta.name,
      saldo: parseFloat(conta.balance)
    }));

    // 3. Receitas e Saldos (Últimos 6 Meses)
    const receitasSaldoUltimos6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
      const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
      
      const receitas = await Income.sum('value', {
        where: {
          user_id: userId,
          date: { [Op.between]: [primeiroDia, ultimoDia] },
        },
      }) || 0;

      const despesas = await Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [primeiroDia, ultimoDia] },
        },
      }) || 0;

      const saldoFinal = receitas - despesas;
      
      receitasSaldoUltimos6Meses.push({
        mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: receitas,
        saldoFinal: saldoFinal
      });
    }

    // 4. Despesas do Mês - Incluir despesas gerais + faturas de cartão (consolidadas)
    const despesasGerais = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
        credit_card_id: null, // Só despesas de conta
      },
    }) || 0;

    // Buscar faturas de cartão usando mesma regra do Dashboard
    const cartoes = await CreditCard.findAll({
      where: { user_id: userId, status: 'ativa' }
    });

    // Ajuste: somar faturas por MÊS DE VENCIMENTO explícito (corrente e próximo),
    // alinhado com a aba Cartões/Faturas, evitando mistura por cartão.
    let somaFaturaPeriodoAtual = 0;      // Faturas que vencem no mês corrente
    let somaFaturaPeriodoProximo = 0;    // Faturas que vencem no próximo mês

    // Determinar meses de vencimento corrente e próximo com base em hojeBrasil
    const anoCorrente = hojeBrasil.getFullYear();
    const mesCorrente = hojeBrasil.getMonth(); // 0-11
    let anoProximo = anoCorrente;
    let mesProximo = mesCorrente + 1;
    if (mesProximo > 11) { mesProximo = 0; anoProximo += 1; }

    for (const cartao of cartoes) {
      // Período da fatura que vence no mês corrente
      const periodoCorrente = getBillPeriodForMonth(cartao.closing_day, cartao.due_day, anoCorrente, mesCorrente);
      const atualStart = formatDateOnly(periodoCorrente.start);
      const atualEnd = formatDateOnly(periodoCorrente.end);
      const totalAtualCartao = await Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: cartao.id,
          due_date: { [Op.between]: [atualStart, atualEnd] },
        },
      }) || 0;
      somaFaturaPeriodoAtual += Number(totalAtualCartao) || 0;

      // Período da fatura que vence no próximo mês
      const periodoProximo = getBillPeriodForMonth(cartao.closing_day, cartao.due_day, anoProximo, mesProximo);
      const proxStart = formatDateOnly(periodoProximo.start);
      const proxEnd = formatDateOnly(periodoProximo.end);
      const totalProximoCartao = await Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: cartao.id,
          due_date: { [Op.between]: [proxStart, proxEnd] },
        },
      }) || 0;
      somaFaturaPeriodoProximo += Number(totalProximoCartao) || 0;
    }

    const despesasMes = {
      gerais: despesasGerais,
      faturasProximoMes: somaFaturaPeriodoProximo,
      faturasMesCorrente: somaFaturaPeriodoAtual,
      // Total = Despesas Gerais + Faturas do Período Atual (conforme solicitado)
      total: Number(despesasGerais) + Number(somaFaturaPeriodoAtual)
    };

    console.log('Despesas do mês (consolidadas):', despesasMes);

    // 5. Total de Despesas (Últimos 6 Meses)
    const totalDespesasUltimos6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
      const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
      
      const total = await Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [primeiroDia, ultimoDia] },
        },
      }) || 0;
      
      totalDespesasUltimos6Meses.push({
        mes: data.toLocaleDateString('pt-BR', { month: 'short' }),
        total: total
      });
    }

    // 6. Gastos por Cartão de Crédito (mostrar valor da fatura em aberto - período atual)
    const gastosPorCartao = [];
    for (const cartao of cartoes) {
      const periods = getBillPeriodsFromRef(cartao.closing_day, cartao.due_day, new Date());
      const openPeriod = periods.atual;
      const faturaAtualValor = await Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: cartao.id,
          due_date: { [Op.between]: [formatDateOnly(openPeriod.start), formatDateOnly(openPeriod.end)] },
        },
      }) || 0;

      // Só incluir cartões com valor em aberto > 0
      if (Number(faturaAtualValor) > 0) {
        gastosPorCartao.push({
          nome: cartao.name,
          total: Number(faturaAtualValor) || 0,
          fechamento: openPeriod.end,
          vencimento: openPeriod.vencimento, // Adicionar data de vencimento
        });
      }
    }

    // 7. Orçamento vs. Gasto por Cartão
    const orcamentoVsGasto = [];
    for (const cartao of cartoes) {
      // Buscar orçamento do cartão
      const orcamento = await Budget.findOne({
        where: {
          user_id: userId,
          type: 'cartao',
          credit_card_id: cartao.id,
          period_start: { [Op.lte]: ultimoDiaMes },
          period_end: { [Op.gte]: primeiroDiaMes },
        },
      });

      // Buscar gastos reais do mês atual (despesas do cartão no mês vigente)
      const gastoAtual = await Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: cartao.id,
          due_date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
          status: { [Op.ne]: 'paga' },
        },
      }) || 0;

      orcamentoVsGasto.push({
        cartao: cartao.name,
        orcamento: orcamento ? parseFloat(orcamento.planned_value) : 0,
        gastoAtual: gastoAtual
      });
    }

    // 8. Próximos Vencimentos (sem alterações)
    const proximosVencimentos = [];
    
    // Despesas próximas (próximos 15 dias)
    const daqui15Dias = new Date();
    daqui15Dias.setDate(hoje.getDate() + 15);
    
    const despesasProximas = await Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [hoje, daqui15Dias] },
        status: { [Op.in]: ['pendente', 'atrasada'] },
        credit_card_id: null, // Só despesas de conta
      },
      order: [['due_date', 'ASC']],
      limit: 10,
    });

    for (const despesa of despesasProximas) {
      proximosVencimentos.push({
        descricao: despesa.description,
        valor: parseFloat(despesa.value),
        vencimento: despesa.due_date
      });
    }

    // Faturas de cartão próximas
    for (const cartao of cartoes) {
      const dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), cartao.due_day);
      if (dataVencimento <= hoje) {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      if (dataVencimento <= daqui15Dias) {
        const periods = getBillPeriodsFromRef(cartao.closing_day, cartao.due_day, new Date());
        const openPeriod = periods.atual;
        const totalFatura = await Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: cartao.id,
            due_date: { [Op.between]: [formatDateOnly(openPeriod.start), formatDateOnly(openPeriod.end)] },
          },
        }) || 0;

        if (totalFatura > 0) {
          proximosVencimentos.push({
            descricao: `Fatura ${cartao.name}`,
            valor: totalFatura,
            vencimento: dataVencimento
          });
        }
      }
    }

    // Ordenar por data de vencimento
    proximosVencimentos.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

    // 9. Despesas Parceladas
    const despesasParceladas = [];
    
    // Buscar apenas as parcelas cujo vencimento está no mês vigente
    const despesasParceladasDB = await Expense.findAll({
      where: {
        user_id: userId,
        installment_total: { [Op.gt]: 1 },
        due_date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
      },
      include: [
        { model: CreditCard, as: 'credit_card', attributes: ['name'] }
      ],
      order: [['due_date', 'ASC']],
      limit: 10,
    });

    for (const despesa of despesasParceladasDB) {
      despesasParceladas.push({
        item: despesa.description,
        cartao: despesa.credit_card ? despesa.credit_card.name : 'Conta',
        parcelaAtual: despesa.installment_number || 1,
        totalParcelas: despesa.installment_total || 1,
        valor: parseFloat(despesa.value),
        vencimento: despesa.due_date,
      });
    }

    res.json({
      receitasMes,
      saldoPorConta,
      receitasSaldoUltimos6Meses,
      despesasMes,
      totalDespesasUltimos6Meses,
      gastosPorCartao,
      orcamentoVsGasto,
      proximosVencimentos,
      despesasParceladas
    });

  } catch (err) {
    console.error('Erro no resumo:', err);
    res.status(500).json({ 
      error: 'Erro ao buscar dados do resumo', 
      details: err.message, 
      stack: err.stack 
    });
  }
};
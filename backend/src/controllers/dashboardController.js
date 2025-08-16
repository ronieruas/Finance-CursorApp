const { Account, Income, Expense, CreditCard, CreditCardTransaction } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const models = require('../models');


exports.getDashboard = async (req, res) => {
  try {
    console.log('Dashboard: início da requisição');
    const userId = req.user.id;
    // Filtro de período
    let { start, end } = req.query;
    let today = new Date();
    let firstDay = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1);
    let lastDay = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 1, 0);
    console.log('Dashboard: período', { firstDay, lastDay });

    // Saldo total (apenas contas em reais)
    const accountsReais = await models.Account.findAll({ where: { user_id: userId, status: 'ativa', currency: { [Op.or]: [null, 'BRL'] } } });
    const saldoTotalReais = accountsReais.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    // Receitas do período (por conta)
    const receitasPorConta = await models.Income.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
      attributes: ['account_id', [sequelize.fn('sum', sequelize.col('value')), 'total']],
      group: ['account_id'],
    });

    // Despesas de conta (não associadas a cartão)
    const despesasConta = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        account_id: { [Op.ne]: null },
        credit_card_id: null,
      },
    });

    // Despesas de cartão (apenas associadas a cartão)
    const despesasCartao = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        credit_card_id: { [Op.ne]: null },
        status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
      },
    });

    // Soma total de despesas do mês (conta + cartão, sem duplicidade)
    const despesasMesTotal = (despesasConta || 0) + (despesasCartao || 0);

    // Valor da fatura do cartão do mês (parcelas com due_date no mês)
    const creditCards = await models.CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } });
    const cardIds = creditCards.map(c => c.id);
    let faturaCartaoMes = 0;
    let gastosPorCartao = [];
    if (cardIds.length > 0) {
      // Soma despesas do cartão (não pagas)
      const despesasCartaoMes = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [firstDay, lastDay] },
          credit_card_id: { [Op.in]: cardIds },
          status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
        },
      }) || 0;
      // NÃO existe receitas de cartão (Income.credit_card_id não existe)
      // const receitasCartaoMes = await Income.sum('value', { ... })
      faturaCartaoMes = despesasCartaoMes;
      // Detalhamento por cartão
      for (const card of creditCards) {
        const totalDespesas = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            due_date: { [Op.between]: [firstDay, lastDay] },
            credit_card_id: card.id,
            status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
          },
        }) || 0;
        // const totalReceitas = await models.Income.sum('value', { ... })
        gastosPorCartao.push({
          card_id: card.id,
          card_name: card.name,
          card_bank: card.bank,
          total: totalDespesas
        });
      }
    }

    // Orçamentos do período: valor planejado e valor gasto até a data
    const budgets = await models.Budget.findAll({
      where: {
        user_id: userId,
        period_start: { [Op.lte]: lastDay },
        period_end: { [Op.gte]: firstDay },
      },
      include: [
        { model: models.CreditCard, as: 'credit_card', attributes: ['name', 'bank'] }
      ]
    });
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      let utilizado = 0;
      if (budget.type === 'geral') {
        // Orçamento geral: considera TODAS as despesas (pagas e não pagas)
        utilizado = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            due_date: { [Op.between]: [budget.period_start, budget.period_end] },
          },
        });
      } else if (budget.type === 'cartao') {
        // Orçamento de cartão: considera apenas despesas não pagas
        const whereClause = {
          user_id: userId,
          due_date: { [Op.between]: [budget.period_start, budget.period_end] },
          credit_card_id: { [Op.ne]: null },
          status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
        };
        
        if (budget.credit_card_id) {
          whereClause.credit_card_id = budget.credit_card_id;
        }
        
        utilizado = await models.Expense.sum('value', { where: whereClause });
      }
      return {
        ...budget.toJSON(),
        utilizado: utilizado || 0
      };
    }));

    // Breakdown do período
    const receitasPeriodo = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;
    const despesasPeriodo = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;
    const cartaoPeriodo = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        credit_card_id: { [Op.ne]: null },
        status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
      },
    }) || 0;
    const breakdown = {
      receitas: receitasPeriodo,
      despesas: despesasPeriodo,
      cartao: cartaoPeriodo,
    };

    // Transações recentes (10 últimas do período)
    const receitasRecentes = await models.Income.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
      order: [['date', 'DESC']],
      limit: 20,
    });
    const despesasRecentes = await models.Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
      order: [['due_date', 'DESC']],
      limit: 20,
    });
    // Unir, normalizar e pegar as 10 mais recentes
    // Buscar contas e cartões para mapear nomes
    const contasMap = {};
    const contas = await models.Account.findAll({ where: { user_id: userId } });
    contas.forEach(c => { contasMap[c.id] = c.name; });
    const cartoesMap = {};
    const cartoes = await models.CreditCard.findAll({ where: { user_id: userId } });
    cartoes.forEach(c => { cartoesMap[c.id] = c.name; });
    
    // Função para formatar data dd/mm/aaaa
    function formatDateBR(dateStr) {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Adicionar receitas de cartão separadas
    // const receitasCartaoRecentes = receitasRecentes.filter(r => r.credit_card_id);
    // const receitasContaRecentes = receitasRecentes.filter(r => !r.credit_card_id);
    const recentesRaw = [

      ...receitasRecentes.map(r => ({
        tipo: 'receita',
        descricao: r.description || r.name || 'Receita',
        valor: r.value,
        data: formatDateBR(r.date),
        conta: r.account_id,
        conta_nome: contasMap[r.account_id] || '',
        cartao_id: null,
        cartao_nome: '',
      })),
      ...despesasRecentes.map(d => ({
        tipo: d.credit_card_id ? 'cartao' : 'despesa',
        descricao: d.description || d.name || 'Despesa',
        valor: d.value,
        data: formatDateBR(d.due_date),
        conta: d.account_id || d.credit_card_id,
        conta_nome: d.credit_card_id ? (cartoesMap[d.credit_card_id] || '') : (contasMap[d.account_id] || ''),
        cartao_id: d.credit_card_id || null,
        cartao_nome: d.credit_card_id ? (cartoesMap[d.credit_card_id] || '') : '',
      })),
    ];

    // Soma das receitas do mês vigente
    const receitasMesVigente = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;

    // Soma das despesas do mês vigente (com vencimento no mês)
    const despesasMesVigente = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;

    // Soma das faturas de cartões de crédito fechadas ou a fechar no mês vigente
    let faturasCartaoMesVigente = 0;
    if (cardIds.length > 0) {
      faturasCartaoMesVigente = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [firstDay, lastDay] },
          credit_card_id: { [Op.in]: cardIds },
          status: { [Op.ne]: 'paga' }, // Considerar apenas despesas não pagas
        },
      }) || 0;


    }
    const recentes = recentesRaw
      .sort((a, b) => {
        const [da, ma, aa] = a.data.split('/');
        const [db, mb, ab] = b.data.split('/');
        return new Date(`${ab}-${mb}-${db}`) - new Date(`${aa}-${ma}-${da}`);
      })
      .slice(0, 10);

    // Alertas automáticos
    const alertas = [];
    // 1. Saldo baixo
    contas.forEach(c => {
      if (parseFloat(c.balance) < 100) {
        alertas.push({
          id: `saldo_baixo_${c.id}`,
          descricao: `Saldo baixo na conta ${c.name}: R$ ${Number(c.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          cor: '#ef4444',
        });
      }
    });
    // 2. Orçamento estourado
    budgetsWithSpent.forEach(b => {
      if (parseFloat(b.utilizado) > parseFloat(b.planned_value)) {
        alertas.push({
          id: `orcamento_estourado_${b.id}`,
          descricao: `Orçamento estourado: ${b.name} (Utilizado: R$ ${Number(b.utilizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Planejado: R$ ${Number(b.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          cor: '#ef4444',
        });
      }
    });
    // 3. Fatura alta
    for (const card of creditCards) {
      const totalFatura = await Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [firstDay, lastDay] },
          credit_card_id: card.id,
        },
      }) || 0;
      if (parseFloat(totalFatura) > 0.8 * parseFloat(card.limit_value)) {
        alertas.push({
          id: `fatura_alta_${card.id}`,
          descricao: `Fatura alta no cartão ${card.name}: R$ ${Number(totalFatura).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Limite: R$ ${Number(card.limit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          cor: '#f59e42',
        });
      }
    }
    // 4. Próximos vencimentos
    const hoje = new Date();
    const daqui7 = new Date();
    daqui7.setDate(hoje.getDate() + 7);
    const proximosVencimentos = await Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [hoje, daqui7] },
        status: { [Op.in]: ['pendente', 'atrasada'] },
        credit_card_id: null, // Só contas, não cartão
      },
      order: [['due_date', 'ASC']],
      limit: 10,
    });
    proximosVencimentos.forEach(e => {
      alertas.push({
        id: `vencimento_${e.id}`,
        descricao: `Vencimento em breve: ${e.description} (R$ ${Number(e.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) em ${new Date(e.due_date).toLocaleDateString('pt-BR')}`,
        cor: '#2563eb',
      });
    });

    // Evolução diária do saldo
    let saldoEvolucao = [];
    let saldoAnterior = 0;
    // Buscar todas as contas em reais
    const contasReais = await Account.findAll({ where: { user_id: userId, status: 'ativa', currency: { [Op.or]: [null, 'BRL'] } } });
    // Buscar todas as receitas e despesas do período
    const receitas = await Income.findAll({ where: { user_id: userId, date: { [Op.between]: [firstDay, lastDay] } } });
    const despesas = await Expense.findAll({ where: { user_id: userId, due_date: { [Op.between]: [firstDay, lastDay] } } });
    // Saldo inicial (antes do período)
    const saldoInicial = contasReais.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
    // Montar mapa de receitas/despesas por dia
    const receitasPorDia = {};
    receitas.forEach(r => {
      let d = r.date;
      if (d instanceof Date) d = d.toISOString().slice(0,10);
      if (typeof d === 'string' && d.length > 10) d = d.slice(0,10);
      receitasPorDia[d] = (receitasPorDia[d] || 0) + parseFloat(r.value);
    });
    const despesasPorDia = {};
    despesas.forEach(d => {
      let dt = d.due_date;
      if (dt instanceof Date) dt = dt.toISOString().slice(0,10);
      if (typeof dt === 'string' && dt.length > 10) dt = dt.slice(0,10);
      despesasPorDia[dt] = (despesasPorDia[dt] || 0) + parseFloat(d.value);
    });
    // Calcular saldo dia a dia
    let saldo = saldoInicial;
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().slice(0,10);
      saldo += (receitasPorDia[dataStr] || 0) - (despesasPorDia[dataStr] || 0);
      saldoEvolucao.push({ data: dataStr, saldo: saldo });
    }

    res.json({
      saldoTotalReais,
      receitasPorConta,
      despesasConta: despesasConta || 0,
      despesasCartao: despesasCartao || 0,
      despesasMesTotal,
      faturaCartaoMes: faturaCartaoMes || 0,
      gastosPorCartao,
      budgets: budgetsWithSpent,
      breakdown,
      recentes: recentesFormatadas,
      receitasMesVigente,
      despesasMesVigente,
      faturasCartaoMesVigente,
      receitasMesVigente,
      despesasMesVigente,
      faturasCartaoMesVigente,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // 1. Soma das Receitas do Mês vigente
    const totalIncomes = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [currentMonthStart, currentMonthEnd] },
      },
    }) || 0;

    // 2. Soma das Despesas do mês vigente (somente as com vencimento no mês vigente)
    const totalExpenses = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [currentMonthStart, currentMonthEnd] },
        credit_card_id: null, // Excluir despesas de cartão de crédito
      },
    }) || 0;

    // 3. Soma das faturas dos cartões de crédito que fecham ou já estão fechadas no mês vigente
    let totalCreditCardBills = 0;
    const creditCards = await models.CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } });

    for (const card of creditCards) {
      // Calcular a data de fechamento da fatura para o mês atual
      let closingDayThisMonth = new Date(today.getFullYear(), today.getMonth(), card.closing_day);
      // Se o dia de fechamento já passou neste mês, a fatura é do próximo mês
      if (today.getDate() > card.closing_day) {
        closingDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, card.closing_day);
      }

      // A data de vencimento da fatura é geralmente um mês após o fechamento
      const billDueDate = new Date(closingDayThisMonth.getFullYear(), closingDayThisMonth.getMonth() + 1, card.due_day);

      // Considerar despesas com due_date no mês vigente da fatura
      // O período da fatura vai do dia de fechamento do mês anterior até o dia de fechamento do mês atual
      const previousMonthClosingDay = new Date(closingDayThisMonth.getFullYear(), closingDayThisMonth.getMonth() - 1, card.closing_day);
      const billPeriodStart = new Date(previousMonthClosingDay.getFullYear(), previousMonthClosingDay.getMonth(), previousMonthClosingDay.getDate() + 1);
      const billPeriodEnd = new Date(closingDayThisMonth.getFullYear(), closingDayThisMonth.getMonth(), closingDayThisMonth.getDate());

      const cardExpenses = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: card.id,
          due_date: { [Op.between]: [billPeriodStart, billPeriodEnd] },
          status: { [Op.ne]: 'paga' }, // Considerar apenas despesas não pagas para o cálculo da fatura
        },
      }) || 0;
      totalCreditCardBills += cardExpenses;
    }

    // 4. Saldo
    const balance = totalIncomes - (totalExpenses + totalCreditCardBills);

    res.json({
      totalIncomes,
      totalExpenses,
      totalCreditCardBills,
      balance,
    });
  } catch (error) {
    console.error('Erro ao buscar resumo mensal:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo mensal' });
  }
};
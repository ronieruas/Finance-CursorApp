const { Account, Income, Expense, CreditCard, CreditCardTransaction } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    // Filtro de período
    let { start, end } = req.query;
    let today = new Date();
    let firstDay = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1);
    let lastDay = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Saldo total (todas as contas ativas)
    const accounts = await Account.findAll({ where: { user_id: userId, status: 'ativa' } });
    const saldoTotal = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    // Receitas do período
    const receitasMes = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    // Despesas do período
    const despesasMes = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    // Gastos em cartão do período (detalhado por cartão)
    const creditCards = await CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } });
    const cardIds = creditCards.map(c => c.id);
    let cartaoMes = 0;
    let gastosPorCartao = [];
    if (cardIds.length > 0) {
      cartaoMes = await CreditCardTransaction.sum('value', {
        where: {
          user_id: userId,
          card_id: { [Op.in]: cardIds },
          date: { [Op.between]: [firstDay, lastDay] },
        },
      });
      // Detalhamento por cartão
      for (const card of creditCards) {
        const total = await CreditCardTransaction.sum('value', {
          where: {
            user_id: userId,
            card_id: card.id,
            date: { [Op.between]: [firstDay, lastDay] },
          },
        });
        gastosPorCartao.push({
          card_id: card.id,
          card_name: card.name,
          card_bank: card.bank,
          total: total || 0
        });
      }
    }

    // Saldo mensal
    const saldoMensal = (receitasMes || 0) - (despesasMes || 0) - (cartaoMes || 0);

    // Breakdown
    const breakdown = {
      receitas: receitasMes || 0,
      despesas: despesasMes || 0,
      cartao: cartaoMes || 0,
    };

    // Orçamentos do período
    const budgets = await require('../models').Budget.findAll({
      where: {
        user_id: userId,
        period_start: { [Op.lte]: lastDay },
        period_end: { [Op.gte]: firstDay },
      },
    });

    // Transações recentes (últimas 5 de receitas e despesas)
    const recentesReceitas = await Income.findAll({
      where: { user_id: userId },
      order: [['date', 'DESC']],
      limit: 3,
    });
    const recentesDespesas = await Expense.findAll({
      where: { user_id: userId },
      order: [['due_date', 'DESC']],
      limit: 2,
    });
    const recentes = [
      ...recentesReceitas.map(r => ({ tipo: 'receita', descricao: r.description, valor: r.value, data: r.date, conta: r.account_id })),
      ...recentesDespesas.map(d => ({ tipo: 'despesa', descricao: d.description, valor: d.value, data: d.due_date, conta: d.account_id })),
    ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

    // Alertas: despesas vencendo nos próximos 7 dias e atrasadas
    const hoje = new Date();
    const daqui7 = new Date();
    daqui7.setDate(hoje.getDate() + 7);
    const vencendo = await Expense.findAll({
      where: {
        user_id: userId,
        status: 'pendente',
        due_date: { [Op.between]: [hoje, daqui7] },
      },
    });
    const atrasadas = await Expense.findAll({
      where: {
        user_id: userId,
        status: 'atrasada',
      },
    });
    const alertas = [
      ...vencendo.map(e => ({ tipo: 'vencimento', descricao: `${e.description} vence em ${Math.ceil((new Date(e.due_date) - hoje) / (1000*60*60*24))} dias`, cor: 'orange' })),
      ...atrasadas.map(e => ({ tipo: 'atraso', descricao: `${e.description} em atraso!`, cor: 'red' })),
    ];

    res.json({
      saldoTotal,
      receitasMes: receitasMes || 0,
      despesasMes: despesasMes || 0,
      cartaoMes: cartaoMes || 0,
      saldoMensal,
      breakdown,
      gastosPorCartao,
      budgets,
      recentes,
      alertas,
      periodo: { start: firstDay, end: lastDay }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard', details: err.message });
  }
}; 
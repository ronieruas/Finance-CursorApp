const { Account, Income, Expense, CreditCard, CreditCardTransaction } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Saldo total (todas as contas ativas)
    const accounts = await Account.findAll({ where: { user_id: userId, status: 'ativa' } });
    const saldoTotal = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);

    // Receitas do mês
    const receitasMes = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    // Despesas do mês
    const despesasMes = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    });

    // Gastos em cartão do mês
    const creditCards = await CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } });
    const cardIds = creditCards.map(c => c.id);
    let cartaoMes = 0;
    if (cardIds.length > 0) {
      cartaoMes = await CreditCardTransaction.sum('value', {
        where: {
          user_id: userId,
          card_id: { [Op.in]: cardIds },
          date: { [Op.between]: [firstDay, lastDay] },
        },
      });
    }

    // Saldo mensal
    const saldoMensal = (receitasMes || 0) - (despesasMes || 0) - (cartaoMes || 0);

    // Breakdown
    const breakdown = {
      receitas: receitasMes || 0,
      despesas: despesasMes || 0,
      cartao: cartaoMes || 0,
    };

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
      recentes,
      alertas,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard', details: err.message });
  }
}; 
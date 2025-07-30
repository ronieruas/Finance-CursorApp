const { Account, Income, Expense, CreditCard, CreditCardTransaction, Budget } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

exports.getAnalyticsDashboard = async (req, res) => {
  try {
    console.log('Analytics Dashboard: início da requisição');
    const userId = req.user.id;
    
    // Filtro de período
    let { start, end, period } = req.query;
    let today = new Date();
    
    // Definir período baseado no parâmetro
    let firstDay, lastDay;
    if (period === 'last3months') {
      firstDay = new Date(today.getFullYear(), today.getMonth() - 3, 1);
      lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'last6months') {
      firstDay = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'last12months') {
      firstDay = new Date(today.getFullYear() - 1, today.getMonth(), 1);
      lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      firstDay = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1);
      lastDay = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    console.log('Analytics Dashboard: período', { firstDay, lastDay });

    // 1. TENDÊNCIAS MENSAIS
    const tendenciasMensais = await getTendenciasMensais(userId, firstDay, lastDay);

    // 2. ANÁLISE DE CATEGORIAS
    const analiseCategorias = await getAnaliseCategorias(userId, firstDay, lastDay);

    // 3. COMPARATIVO COM MESES ANTERIORES
    const comparativoMensal = await getComparativoMensal(userId, today);

    // 4. PROJEÇÕES
    const projecoes = await getProjecoes(userId, today);

    // 5. ANÁLISE DE CARTÕES DE CRÉDITO
    const analiseCartoes = await getAnaliseCartoes(userId, firstDay, lastDay);

    // 6. METAS E OBJETIVOS
    const metas = await getMetas(userId, firstDay, lastDay);

    res.json({
      tendenciasMensais,
      analiseCategorias,
      comparativoMensal,
      projecoes,
      analiseCartoes,
      metas,
      periodo: { start: firstDay, end: lastDay }
    });

  } catch (err) {
    console.error('Erro no Analytics Dashboard:', err);
    res.status(500).json({ error: err.message });
  }
};

// Função para obter tendências mensais
async function getTendenciasMensais(userId, firstDay, lastDay) {
  const meses = [];
  const receitas = [];
  const despesas = [];
  const saldos = [];

  let currentDate = new Date(firstDay);
  let saldoAcumulado = 0;

  while (currentDate <= lastDay) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Receitas do mês
    const receitasMes = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [monthStart, monthEnd] },
      },
    }) || 0;

    // Despesas do mês
    const despesasMes = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [monthStart, monthEnd] },
      },
    }) || 0;

    saldoAcumulado += (receitasMes - despesasMes);

    meses.push(currentDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
    receitas.push(Number(receitasMes));
    despesas.push(Number(despesasMes));
    saldos.push(saldoAcumulado);

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return { meses, receitas, despesas, saldos };
}

// Função para análise de categorias
async function getAnaliseCategorias(userId, firstDay, lastDay) {
  // Top categorias de despesas
  const topCategoriasDespesas = await Expense.findAll({
    where: {
      user_id: userId,
      due_date: { [Op.between]: [firstDay, lastDay] },
      category: { [Op.ne]: null },
    },
    attributes: [
      'category',
      [sequelize.fn('sum', sequelize.col('value')), 'total'],
      [sequelize.fn('count', sequelize.col('id')), 'quantidade']
    ],
    group: ['category'],
    order: [[sequelize.fn('sum', sequelize.col('value')), 'DESC']],
    limit: 10,
  });

  // Top categorias de receitas
  const topCategoriasReceitas = await Income.findAll({
    where: {
      user_id: userId,
      date: { [Op.between]: [firstDay, lastDay] },
      category: { [Op.ne]: null },
    },
    attributes: [
      'category',
      [sequelize.fn('sum', sequelize.col('value')), 'total'],
      [sequelize.fn('count', sequelize.col('id')), 'quantidade']
    ],
    group: ['category'],
    order: [[sequelize.fn('sum', sequelize.col('value')), 'DESC']],
    limit: 10,
  });

  return {
    topDespesas: topCategoriasDespesas.map(item => ({
      categoria: item.category,
      total: Number(item.dataValues.total),
      quantidade: Number(item.dataValues.quantidade)
    })),
    topReceitas: topCategoriasReceitas.map(item => ({
      categoria: item.category,
      total: Number(item.dataValues.total),
      quantidade: Number(item.dataValues.quantidade)
    }))
  };
}

// Função para comparativo mensal
async function getComparativoMensal(userId, today) {
  const mesAtual = new Date(today.getFullYear(), today.getMonth(), 1);
  const mesAnterior = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const mesAnterior2 = new Date(today.getFullYear(), today.getMonth() - 2, 1);

  const meses = [
    { start: mesAnterior2, end: new Date(today.getFullYear(), today.getMonth() - 1, 0), nome: 'Mês -2' },
    { start: mesAnterior, end: new Date(today.getFullYear(), today.getMonth(), 0), nome: 'Mês -1' },
    { start: mesAtual, end: new Date(today.getFullYear(), today.getMonth() + 1, 0), nome: 'Mês Atual' }
  ];

  const comparativo = await Promise.all(meses.map(async (mes) => {
    const receitas = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [mes.start, mes.end] },
      },
    }) || 0;

    const despesas = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [mes.start, mes.end] },
      },
    }) || 0;

    return {
      mes: mes.nome,
      receitas: Number(receitas),
      despesas: Number(despesas),
      saldo: Number(receitas - despesas)
    };
  }));

  return comparativo;
}

// Função para projeções
async function getProjecoes(userId, today) {
  // Média de receitas dos últimos 3 meses
  const mediaReceitas = await getMediaReceitas(userId, 3);
  
  // Média de despesas dos últimos 3 meses
  const mediaDespesas = await getMediaDespesas(userId, 3);

  // Projeção para o próximo mês
  const proximoMes = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const fimProximoMes = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  return {
    mediaReceitas,
    mediaDespesas,
    projecaoSaldo: mediaReceitas - mediaDespesas,
    proximoMes: proximoMes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  };
}

// Função para análise de cartões
async function getAnaliseCartoes(userId, firstDay, lastDay) {
  const cartoes = await CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } });
  
  const analiseCartoes = await Promise.all(cartoes.map(async (cartao) => {
    const despesas = await Expense.sum('value', {
      where: {
        user_id: userId,
        credit_card_id: cartao.id,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0;

    const limiteUtilizado = (despesas / cartao.limit_value) * 100;

    return {
      id: cartao.id,
      nome: cartao.name,
      banco: cartao.bank,
      limite: Number(cartao.limit_value),
      utilizado: Number(despesas),
      limiteUtilizado: Number(limiteUtilizado.toFixed(2)),
      disponivel: Number(cartao.limit_value - despesas)
    };
  }));

  return analiseCartoes;
}

// Função para metas
async function getMetas(userId, firstDay, lastDay) {
  // Buscar orçamentos ativos
  const budgets = await Budget.findAll({
    where: {
      user_id: userId,
      period_start: { [Op.lte]: lastDay },
      period_end: { [Op.gte]: firstDay },
    },
    include: [
      { model: CreditCard, as: 'credit_card', attributes: ['name', 'bank'] }
    ]
  });

  const metas = await Promise.all(budgets.map(async (budget) => {
    let utilizado = 0;
    if (budget.type === 'geral') {
      utilizado = await Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        },
      }) || 0;
    } else if (budget.type === 'cartao') {
      // Se tem credit_card_id específico, filtrar por esse cartão
      const whereClause = {
        user_id: userId,
        due_date: { [Op.between]: [budget.period_start, budget.period_end] },
        credit_card_id: { [Op.ne]: null },
      };
      
      if (budget.credit_card_id) {
        whereClause.credit_card_id = budget.credit_card_id;
      }
      
      utilizado = await Expense.sum('value', { where: whereClause }) || 0;
    }

    const percentual = (utilizado / budget.planned_value) * 100;
    const status = percentual > 100 ? 'excedido' : percentual > 80 ? 'atencao' : 'normal';

    return {
      id: budget.id,
      nome: budget.name,
      tipo: budget.type,
      planejado: Number(budget.planned_value),
      utilizado: Number(utilizado),
      percentual: Number(percentual.toFixed(2)),
      status
    };
  }));

  return metas;
}

// Funções auxiliares
async function getMediaReceitas(userId, meses) {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

  const total = await Income.sum('value', {
    where: {
      user_id: userId,
      date: { [Op.between]: [inicio, fim] },
    },
  }) || 0;

  return Number(total / meses);
}

async function getMediaDespesas(userId, meses) {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses, 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);

  const total = await Expense.sum('value', {
    where: {
      user_id: userId,
      due_date: { [Op.between]: [inicio, fim] },
    },
  }) || 0;

  return Number(total / meses);
} 
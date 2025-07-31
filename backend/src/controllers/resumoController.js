const { Account, Income, Expense, CreditCard, CreditCardTransaction, Budget } = require('../models');
const { Op, Sequelize } = require('sequelize');
const dayjs = require('dayjs');

exports.getResumo = async (req, res) => {
  try {
    console.log('Resumo: início da requisição');
    const userId = req.user.id;
    
    // Período atual (mês atual)
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    
    // 1. Receitas do Mês
    const receitasMes = await Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
      },
    }) || 0;

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

    // 4. Despesas do Mês
    const despesasGerais = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
        credit_card_id: null,
      },
    }) || 0;

    const despesasCartao = await Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [primeiroDiaMes, ultimoDiaMes] },
        credit_card_id: { [Op.ne]: null },
      },
    }) || 0;

    const despesasMes = {
      gerais: despesasGerais,
      cartao: despesasCartao,
      total: despesasGerais + despesasCartao
    };

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

    // 6. Gastos por Cartão de Crédito
    const cartoes = await CreditCard.findAll({
      where: { user_id: userId, status: 'ativa' }
    });

    const gastosPorCartao = [];
    for (const cartao of cartoes) {
      // Buscar faturas abertas (despesas não pagas)
      const totalFatura = await Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: cartao.id,
          status: { [Op.ne]: 'paga' },
        },
      }) || 0;

             // Calcular data de fechamento (próximo fechamento)
       let dataFechamento = new Date(hoje.getFullYear(), hoje.getMonth(), cartao.closing_day);
      if (dataFechamento <= hoje) {
        dataFechamento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, cartao.closing_day);
      }

      gastosPorCartao.push({
        nome: cartao.name,
        total: totalFatura,
        fechamento: dataFechamento
      });
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

      // Buscar gastos reais
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

    // 8. Próximos Vencimentos
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
        const totalFatura = await Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: cartao.id,
            status: { [Op.ne]: 'paga' },
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
    
    // Buscar despesas que são parceladas (com installment_total > 1)
    const despesasParceladasDB = await Expense.findAll({
      where: {
        user_id: userId,
        installment_total: { [Op.gt]: 1 },
        status: { [Op.ne]: 'paga' },
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
        valor: parseFloat(despesa.value)
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
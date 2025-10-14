const { Account, Income, Expense, CreditCard, CreditCardPayment, Transfer } = require('../models')
const { Op } = require('sequelize')
const sequelize = require('sequelize')
const models = require('../models')

// Helper local para formatar data YYYY-MM-DD
function formatDateOnly(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Helper para calcular período da fatura por mês de vencimento (month 0-11)
const getBillPeriodForMonth = (closingDay, dueDay, year, month) => {
  const vencimento = new Date(year, month, dueDay)
  let start
  let end
  if (closingDay > dueDay) {
    start = new Date(year, month - 2, closingDay)
    start.setHours(0, 0, 0, 0)
    end = new Date(year, month - 1, closingDay - 1)
    end.setHours(23, 59, 59, 999)
  } else {
    start = new Date(year, month - 1, closingDay)
    start.setHours(0, 0, 0, 0)
    end = new Date(year, month, closingDay - 1)
    end.setHours(23, 59, 59, 999)
  }
  return { start, end, vencimento }
}

// Helper para obter períodos atual e próxima com base em uma data de referência
function getBillPeriodsFromRef(closingDay, dueDay, refDate = new Date()) {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()
  const day = refDate.getDate()
  let dueYearAtual = year
  let dueMonthAtual
  if (day > dueDay) {
    dueMonthAtual = month + 1
    if (dueMonthAtual > 11) { dueMonthAtual = 0; dueYearAtual += 1 }
  } else {
    dueMonthAtual = month
  }
  let dueYearProxima = dueYearAtual
  let dueMonthProxima = dueMonthAtual + 1
  if (dueMonthProxima > 11) { dueMonthProxima = 0; dueYearProxima += 1 }
  const atual = getBillPeriodForMonth(closingDay, dueDay, dueYearAtual, dueMonthAtual)
  const proxima = getBillPeriodForMonth(closingDay, dueDay, dueYearProxima, dueMonthProxima)
  return { atual, proxima }
}

exports.getDashboard = async (req, res) => {
  try {
    console.log('Dashboard Controller: req.user', req.user)
    const userId = req.user.id
    // Filtro de período
    let { start, end } = req.query
    let today = new Date()
    let firstDay = start ? new Date(start) : new Date(today.getFullYear(), today.getMonth(), 1)
    let lastDay = end ? new Date(end) : new Date(today.getFullYear(), today.getMonth() + 1, 0)
    console.log('Dashboard: período', { firstDay, lastDay })

    // Saldo total (apenas contas em reais)
    const accountsReais = await models.Account.findAll({ where: { user_id: userId, status: 'ativa', currency: { [Op.or]: [null, 'BRL'] } } })
    const saldoTotalReais = accountsReais.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)

    // Receitas do período (por conta)
    const receitasPorConta = await models.Income.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
      attributes: ['account_id', [sequelize.fn('sum', sequelize.col('value')), 'total']],
      group: ['account_id'],
    })

    // Despesas de conta (não associadas a cartão)
    const despesasConta = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        account_id: { [Op.ne]: null },
        credit_card_id: null,
      },
    })

    // Despesas de cartão (apenas associadas a cartão)
    const despesasCartao = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        credit_card_id: { [Op.ne]: null },
        status: { [Op.ne]: 'paga' }, // Excluir despesas já pagas
      },
    })

    // Soma total de despesas do mês (conta + cartão, sem duplicidade)
    const despesasMesTotal = (despesasConta || 0) + (despesasCartao || 0)

    // Valor da fatura do cartão do mês (parcelas com due_date no mês)
    const creditCards = await models.CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } })
    const cardIds = creditCards.map(c => c.id)
    let faturaCartaoMes = 0
    let gastosPorCartao = []
    if (cardIds.length > 0) {
      const despesasCartaoMes = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [firstDay, lastDay] },
          credit_card_id: { [Op.in]: cardIds },
          status: { [Op.ne]: 'paga' },
        },
      }) || 0
      faturaCartaoMes = despesasCartaoMes

      // Detalhamento por cartão com novas colunas
      const refDateBills = lastDay
      const refYear = refDateBills.getFullYear()
      const refMonth = refDateBills.getMonth()
      for (const card of creditCards) {
        // Gastos do mês (todas as despesas do mês vigente do filtro, independentemente do status)
        const gastosMes = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            due_date: { [Op.between]: [firstDay, lastDay] },
            credit_card_id: card.id,
          },
        }) || 0

        // Períodos de fatura baseados NA DATA ATUAL, para alinhar com a aba "Cartões"
        const refDateBills = new Date()
        const periods = getBillPeriodsFromRef(card.closing_day, card.due_day, refDateBills)
        const openPeriod = periods.atual

        // Fatura atual (valor em aberto): despesas não pagas dentro do período aberto
        const faturaAtualValor = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: card.id,
            due_date: { [Op.between]: [formatDateOnly(openPeriod.start), formatDateOnly(openPeriod.end)] },
          },
        }) || 0

        // Fatura fechada: período que vence no mês vigente (refMonth)
        const closedPeriod = getBillPeriodForMonth(card.closing_day, card.due_day, refYear, refMonth)
        const closedStart = formatDateOnly(closedPeriod.start)
        const closedEnd = formatDateOnly(closedPeriod.end)
        const totalFechada = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: card.id,
            due_date: { [Op.between]: [closedStart, closedEnd] },
          },
        }) || 0
        const totalFechadaPaga = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: card.id,
            due_date: { [Op.between]: [closedStart, closedEnd] },
            status: 'paga',
          },
        }) || 0
        let statusFechada = 'pendente'
        const notPaid = Number(totalFechada) - Number(totalFechadaPaga)
        if (Number(totalFechada) === 0) {
          statusFechada = 'paga'
        } else if (notPaid <= 0.0001) {
          statusFechada = 'paga'
        } else if (refDateBills > closedPeriod.vencimento) {
          statusFechada = 'atrasada'
        } else {
          statusFechada = 'pendente'
        }

        gastosPorCartao.push({
          card_id: card.id,
          card_name: card.name,
          gastos_mes: Number(gastosMes) || 0,
          fatura_atual: Number(faturaAtualValor) || 0,
          fatura_fechada_valor: Number(totalFechada) || 0,
          fatura_fechada_status: statusFechada,
        })
      }
    }

    // Orçamentos do período
    const budgets = await models.Budget.findAll({
      where: {
        user_id: userId,
        period_start: { [Op.lte]: lastDay },
        period_end: { [Op.gte]: firstDay },
      },
      include: [
        { model: models.CreditCard, as: 'credit_card', attributes: ['name', 'bank'], required: false }
      ]
    })
    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      let utilizado = 0
      if (budget.type === 'geral') {
        utilizado = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            due_date: { [Op.between]: [budget.period_start, budget.period_end] },
          },
        })
      } else if (budget.type === 'cartao') {
        const whereClause = {
          user_id: userId,
          due_date: { [Op.between]: [budget.period_start, budget.period_end] },
          credit_card_id: { [Op.ne]: null },
          status: { [Op.ne]: 'paga' },
        }
        if (budget.credit_card_id) {
          whereClause.credit_card_id = budget.credit_card_id
        }
        utilizado = await models.Expense.sum('value', { where: whereClause })
      }
      return {
        ...budget.toJSON(),
        credit_card: budget.credit_card ? budget.credit_card.toJSON() : null,
        utilizado: utilizado || 0
      }
    }))

    // Breakdown do período
    const receitasPeriodo = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0
    const despesasPeriodo = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0
    const cartaoPeriodo = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        credit_card_id: { [Op.ne]: null },
        status: { [Op.ne]: 'paga' },
      },
    }) || 0
    const breakdown = {
      receitas: receitasPeriodo,
      despesas: despesasPeriodo,
      cartao: cartaoPeriodo,
    }

    // Transações recentes: últimos 45 dias até hoje (independente do período selecionado)
    const hojeRecentes = new Date()
    const inicioRecentes = new Date(hojeRecentes)
    inicioRecentes.setDate(hojeRecentes.getDate() - 45)
    inicioRecentes.setHours(0, 0, 0, 0)
    const fimRecentes = new Date(hojeRecentes)
    fimRecentes.setHours(23, 59, 59, 999)

    const receitasRecentes = await models.Income.findAll({
      where: {
        user_id: userId,
        date: { [Op.between]: [inicioRecentes, fimRecentes] },
      },
      order: [['date', 'DESC']],
      limit: 50,
    })
    const despesasRecentes = await models.Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [inicioRecentes, fimRecentes] },
      },
      order: [['due_date', 'DESC']],
      limit: 50,
    })

    const contasMap = {}
    const contas = await models.Account.findAll({ where: { user_id: userId } })
    contas.forEach(c => { contasMap[c.id] = c.name })
    const cartoesMap = {}
    const cartoes = await models.CreditCard.findAll({ where: { user_id: userId } })
    cartoes.forEach(c => { cartoesMap[c.id] = c.name })

    function formatDateBR(dateStr) {
      const d = new Date(dateStr)
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    }

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
    ]

    // Soma das receitas do mês vigente
    const receitasMesVigente = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [firstDay, lastDay] },
      },
    }) || 0

    // Soma das despesas do mês vigente (com vencimento no mês)
    const despesasMesVigente = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [firstDay, lastDay] },
        credit_card_id: null,
      },
    }) || 0

    // Faturas dos cartões que VENCEM no mês vigente (ciclo)
    let faturasCartaoMesVigente = 0
    if (creditCards && creditCards.length > 0) {
      const baseDateFatura = lastDay
      const vencimentoYear = baseDateFatura.getFullYear()
      const vencimentoMonth = baseDateFatura.getMonth()
      for (const card of creditCards) {
        const { start: billPeriodStart, end: billPeriodEnd } = getBillPeriodForMonth(card.closing_day, card.due_day, vencimentoYear, vencimentoMonth)
        const totalDoCartao = await models.Expense.sum('value', {
          where: {
            user_id: userId,
            credit_card_id: card.id,
            due_date: { [Op.between]: [billPeriodStart, billPeriodEnd] },
          },
        }) || 0
        faturasCartaoMesVigente += totalDoCartao
      }
    }

    const recentes = recentesRaw
      .sort((a, b) => {
        const [da, ma, aa] = a.data.split('/')
        const [db, mb, ab] = b.data.split('/')
        return new Date(`${ab}-${mb}-${db}`) - new Date(`${aa}-${ma}-${da}`)
      })
      .slice(0, 10)

    // Alertas automáticos
    const alertas = []
    // 1. Saldo baixo
    contas.forEach(c => {
      if (parseFloat(c.balance) < 100) {
        alertas.push({
          id: `saldo_baixo_${c.id}`,
          descricao: `Saldo baixo na conta ${c.name}: R$ ${Number(c.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          cor: '#ef4444',
        })
      }
    })
    // 2. Orçamento estourado
    budgetsWithSpent.forEach(b => {
      if (parseFloat(b.utilizado) > parseFloat(b.planned_value)) {
        alertas.push({
          id: `orcamento_estourado_${b.id}`,
          descricao: `Orçamento estourado: ${b.name} (Utilizado: R$ ${Number(b.utilizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / Planejado: R$ ${Number(b.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          cor: '#ef4444',
        })
      }
    })
    // 3. Fatura alta
    for (const card of creditCards) {
      const totalFatura = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          due_date: { [Op.between]: [firstDay, lastDay] },
          credit_card_id: card.id,
        },
      }) || 0
      if (parseFloat(totalFatura) > 0.8 * parseFloat(card.limit_value)) {
        alertas.push({
          id: `fatura_alta_${card.id}`,
          descricao: `Fatura alta no cartão ${card.name}: R$ ${Number(totalFatura).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Limite: R$ ${Number(card.limit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`,
          cor: '#f59e42',
        })
      }
    }
    // 4. Próximos vencimentos (somente contas, não cartão)
    const hoje = new Date()
    const daqui7 = new Date()
    daqui7.setDate(hoje.getDate() + 7)
    const proximosVencimentos = await models.Expense.findAll({
      where: {
        user_id: userId,
        due_date: { [Op.between]: [hoje, daqui7] },
        status: { [Op.in]: ['pendente', 'atrasada'] },
        credit_card_id: null,
      },
      order: [['due_date', 'ASC']],
      limit: 10,
    })
    proximosVencimentos.forEach(e => {
      alertas.push({
        id: `vencimento_${e.id}`,
        descricao: `Vencimento em breve: ${e.description} (R$ ${Number(e.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) em ${new Date(e.due_date).toLocaleDateString('pt-BR')}`,
        cor: '#2563eb',
      })
    })

    // Evolução diária do saldo - SOMENTE contas correntes
    let saldoEvolucao = []
    const contasCorrente = await models.Account.findAll({ where: { user_id: userId, status: 'ativa', currency: { [Op.or]: [null, 'BRL'] }, type: 'corrente' } })
    const correnteIds = contasCorrente.map(a => a.id)

    // Saldo "inicial" (estado atual das correntes)
    const saldoInicial = contasCorrente.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)

    // Buscar receitas, despesas, transferências e pagamentos de cartão que afetam contas correntes dentro do período
    const receitas = await models.Income.findAll({ where: { user_id: userId, account_id: { [Op.in]: correnteIds.length ? correnteIds : [0] }, date: { [Op.between]: [firstDay, lastDay] } } })
    const despesas = await models.Expense.findAll({ where: { user_id: userId, account_id: { [Op.in]: correnteIds.length ? correnteIds : [0] }, credit_card_id: null, due_date: { [Op.between]: [firstDay, lastDay] } } })
    const transfers = await models.Transfer.findAll({ where: { user_id: userId, date: { [Op.between]: [firstDay, lastDay] } } })
    const pagamentosCartao = await models.CreditCardPayment.findAll({ where: { user_id: userId, account_id: { [Op.in]: correnteIds.length ? correnteIds : [0] }, payment_date: { [Op.between]: [firstDay, lastDay] } } })

    const receitasPorDia = {}
    receitas.forEach(r => {
      let d = r.date
      if (d instanceof Date) d = d.toISOString().slice(0, 10)
      if (typeof d === 'string' && d.length > 10) d = d.slice(0, 10)
      receitasPorDia[d] = (receitasPorDia[d] || 0) + parseFloat(r.value)
    })

    const despesasPorDia = {}
    despesas.forEach(d => {
      let dt = d.due_date
      if (dt instanceof Date) dt = dt.toISOString().slice(0, 10)
      if (typeof dt === 'string' && dt.length > 10) dt = dt.slice(0, 10)
      despesasPorDia[dt] = (despesasPorDia[dt] || 0) + parseFloat(d.value)
    })

    const transferNetPorDia = {}
    transfers.forEach(t => {
      let d = t.date
      if (d instanceof Date) d = d.toISOString().slice(0, 10)
      if (typeof d === 'string' && d.length > 10) d = d.slice(0, 10)
      let delta = 0
      if (correnteIds.includes(t.from_account_id)) delta -= parseFloat(t.value)
      if (correnteIds.includes(t.to_account_id)) delta += parseFloat(t.value)
      transferNetPorDia[d] = (transferNetPorDia[d] || 0) + delta
    })

    const pagamentosPorDia = {}
    pagamentosCartao.forEach(p => {
      let d = p.payment_date
      if (d instanceof Date) d = d.toISOString().slice(0, 10)
      if (typeof d === 'string' && d.length > 10) d = d.slice(0, 10)
      pagamentosPorDia[d] = (pagamentosPorDia[d] || 0) - parseFloat(p.value) // pagamento reduz saldo corrente
    })

    let saldo = saldoInicial
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dataStr = d.toISOString().slice(0, 10)
      saldo += (receitasPorDia[dataStr] || 0) - (despesasPorDia[dataStr] || 0) + (transferNetPorDia[dataStr] || 0) + (pagamentosPorDia[dataStr] || 0)
      saldoEvolucao.push({ data: dataStr, saldo: saldo })
    }

    // Quadro separado: Poupança e Investimentos (com totais por moeda)
    const contasPoupInv = await models.Account.findAll({ where: { user_id: userId, status: 'ativa', type: { [Op.in]: ['poupanca', 'investimento'] } } })
    const totalsByCurrency = {}
    contasPoupInv.forEach(acc => {
      const cur = acc.currency || 'BRL'
      totalsByCurrency[cur] = (totalsByCurrency[cur] || 0) + parseFloat(acc.balance)
    })
    const poupancaInvestimentos = {
      total: Number(totalsByCurrency['BRL'] || 0), // somente BRL aqui
      totais_por_moeda: Object.fromEntries(Object.entries(totalsByCurrency).map(([k, v]) => [k, Number(v)])),
      contas: contasPoupInv.map(acc => ({ id: acc.id, name: acc.name, type: acc.type, currency: acc.currency || 'BRL', balance: Number(acc.balance) }))
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
      recentes: recentes,
      alertas,
      saldoEvolucao,
      receitasMesVigente,
      despesasMesVigente,
      faturasCartaoMesVigente,
      poupancaInvestimentos,
    })

  } catch (err) {
    console.error('Erro no Dashboard Controller:', err)
    res.status(500).json({ error: err.message })
  }
}

exports.getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.id
    const { timestamp } = req.query || {}
    let baseDate = null
    if (timestamp) {
      const asNumber = Number(timestamp)
      if (!Number.isNaN(asNumber) && isFinite(asNumber)) {
        baseDate = new Date(asNumber)
      } else {
        const parsed = new Date(timestamp)
        if (!isNaN(parsed.getTime())) baseDate = parsed
      }
    }
    if (!baseDate) baseDate = new Date()

    const currentMonthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    const currentMonthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)

    const totalIncomes = await models.Income.sum('value', {
      where: {
        user_id: userId,
        date: { [Op.between]: [currentMonthStart, currentMonthEnd] },
      },
    }) || 0

    const totalExpenses = await models.Expense.sum('value', {
      where: {
        user_id: userId,
        due_date: { [Op.between]: [currentMonthStart, currentMonthEnd] },
        credit_card_id: null,
      },
    }) || 0

    // Ajuste: faturas que vencem no mês vigente (ciclo)
    const creditCards = await models.CreditCard.findAll({ where: { user_id: userId, status: 'ativa' } })
    let totalCreditCardBills = 0
    const dueYear = currentMonthEnd.getFullYear()
    const dueMonth = currentMonthEnd.getMonth()
    for (const card of creditCards) {
      const { start, end } = getBillPeriodForMonth(card.closing_day, card.due_day, dueYear, dueMonth)
      const sum = await models.Expense.sum('value', {
        where: {
          user_id: userId,
          credit_card_id: card.id,
          due_date: { [Op.between]: [start, end] },
        },
      }) || 0
      totalCreditCardBills += Number(sum)
    }

    const balance = Number(totalIncomes) - (Number(totalExpenses) + Number(totalCreditCardBills))

    res.json({ totalIncomes, totalExpenses, totalCreditCardBills, balance })
  } catch (err) {
    console.error('Erro ao calcular resumo mensal:', err)
    res.status(500).json({ error: err.message })
  }
}
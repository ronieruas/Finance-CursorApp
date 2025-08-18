const { CreditCard, Expense, CreditCardPayment, Account } = require('../models');
const { Op } = require('sequelize');

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
  faturaAtualStart.setHours(0, 0, 0, 0);
  
  const faturaAtualEnd = new Date(fechamentoAtual);
  faturaAtualEnd.setDate(fechamentoAtual.getDate() - 1);
  faturaAtualEnd.setHours(23, 59, 59, 999);
  
  // Período da próxima fatura: do fechamento atual até o dia anterior ao próximo fechamento
  const faturaProximaStart = new Date(fechamentoAtual);
  faturaProximaStart.setHours(0, 0, 0, 0);
  
  const faturaProximaEnd = new Date(fechamentoProxima);
  faturaProximaEnd.setDate(fechamentoProxima.getDate() - 1);
  faturaProximaEnd.setHours(23, 59, 59, 999);
  
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

function getBillPeriodForMonth(closingDay, dueDay, year, month) {
  // Calcula o período da fatura para um mês específico
  // month: 0-11 (janeiro = 0, dezembro = 11)
  // year: ano completo
  
  // Data de vencimento da fatura para o mês especificado
  const vencimento = new Date(year, month, dueDay);
  
  // Calcular o fechamento correspondente ao vencimento
  // O fechamento é sempre anterior ao vencimento
  const fechamento = new Date(vencimento);
  fechamento.setDate(closingDay);
  if (fechamento >= vencimento) {
    // Se o fechamento seria após o vencimento, ajustar para o mês anterior
    fechamento.setMonth(fechamento.getMonth() - 1);
  }
  
  // Período da fatura: do fechamento do mês anterior até o dia anterior ao fechamento atual
  const start = new Date(fechamento);
  start.setMonth(fechamento.getMonth() - 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(fechamento);
  end.setDate(fechamento.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  
  return { start, end, vencimento };
}

exports.list = async (req, res) => {
  const cards = await CreditCard.findAll({ where: { user_id: req.user.id } });
  res.json(cards);
};

exports.create = async (req, res) => {
  try {
    const { bank, brand, limit_value, due_day, closing_day, name, status } = req.body;
    const card = await CreditCard.create({
      user_id: req.user.id,
      bank,
      brand,
      limit_value,
      due_day,
      closing_day,
      name,
      status,
    });
    res.status(201).json(card);
  } catch (err) {
    console.error('Erro ao criar cartão:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { bank, brand, limit_value, due_day, closing_day, name, status } = req.body;
    const card = await CreditCard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    await card.update({ bank, brand, limit_value, due_day, closing_day, name, status });
    res.json(card);
  } catch (err) {
    console.error('Erro ao atualizar cartão:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const card = await CreditCard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
  await card.destroy();
  res.json({ success: true });
};

exports.limits = async (req, res) => {
  const userId = req.user.id;
  const cards = await CreditCard.findAll({ where: { user_id: userId } });
  const result = await Promise.all(cards.map(async card => {
    const utilizado = await Expense.sum('value', {
      where: {
        user_id: userId,
        credit_card_id: card.id,
        status: { [Op.ne]: 'paga' },
      },
    });
    return { card_id: card.id, utilizado: Number(utilizado) || 0 };
  }));
  res.json(result);
};

exports.getBill = async (req, res) => {
  try {
    console.log('[getBill] INÍCIO - req.user:', req.user, 'req.params:', req.params);
    if (!req.user) {
      console.error('[getBill] ERRO: req.user não definido');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const card = await CreditCard.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    console.log('[getBill] Cartão encontrado:', card);
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    const { closing_day } = card;
    const periods = getBillPeriods(closing_day, card.due_day);
    console.log('[getBill] Períodos calculados:', periods);
    // Fatura atual
    const atual = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        // Usar data da compra (due_date) para período da fatura
        due_date: { [Op.between]: [periods.atual.start, periods.atual.end] },
        status: { [Op.ne]: 'paga' }, // Só despesas em aberto
      },
    });
    console.log('[getBill] Despesas fatura atual:', atual);
    // Próxima fatura
    const proxima = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        // Usar data da compra (due_date) para próxima fatura
        due_date: { [Op.between]: [periods.proxima.start, periods.proxima.end] },
      },
    });
    console.log('[getBill] Despesas próxima fatura:', proxima);
    // Garantir arrays e periods formatados
    res.json({
      atual: Array.isArray(atual) ? atual : [],
      proxima: Array.isArray(proxima) ? proxima : [],
      periods: {
        atual: {
          start: periods.atual.start.toISOString(),
          end: periods.atual.end.toISOString(),
        },
        proxima: {
          start: periods.proxima.start.toISOString(),
          end: periods.proxima.end.toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('[getBill] Erro ao buscar fatura do cartão:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.pay = async (req, res) => {
  try {
    const { account_id, value, payment_date, is_full_payment, auto_debit, bill_month } = req.body;
    const userId = req.user.id;
    const cardId = req.params.id;
    // Verifica cartão
    const card = await CreditCard.findOne({ where: { id: cardId, user_id: userId } });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    // Verifica conta
    const account = await Account.findOne({ where: { id: account_id, user_id: userId } });
    if (!account) return res.status(404).json({ error: 'Conta não encontrada' });
    // Valor a pagar
    let valorPagamento = Number(value);
    let despesasFatura = [];
    let periodoFatura = null;
    if (is_full_payment) {
      // Calcula período da fatura baseado em bill_month (competência)
      let periods;
      if (bill_month) {
        // bill_month no formato YYYY-MM
        const [ano, mes] = bill_month.split('-').map(Number);
        // Usar a nova função para calcular período da fatura para o mês informado
        const closingDay = card.closing_day;
        const periodo = getBillPeriodForMonth(closingDay, card.due_day, ano, mes - 1); // mes - 1 porque getBillPeriodForMonth usa 0-11
        periods = { atual: periodo };
      } else {
        const { closing_day } = card;
        periods = getBillPeriods(closing_day, card.due_day);
      }
      periodoFatura = periods.atual;
      console.log('[PAGAMENTO] Período da fatura:', {
        start: periodoFatura.start,
        end: periodoFatura.end,
        bill_month
      });
      console.log('[PAGAMENTO] Período da fatura:', {
        start: periodoFatura.start.toISOString(),
        end: periodoFatura.end.toISOString(),
        bill_month
      });
      
      // PRIMEIRO: Verificar se há despesas em geral para o cartão (sem filtro de data)
      const todasDespesas = await Expense.findAll({
        where: {
          user_id: userId,
          credit_card_id: card.id,
        },
      });
      console.log('[PAGAMENTO] Total de despesas do cartão (sem filtro):', todasDespesas.length);
      todasDespesas.forEach(d => console.log('  ', {
        id: d.id,
        description: d.description,
        createdAt: d.createdAt,
        created_at: d.dataValues.created_at || 'n/a',
        status: d.status,
        valor: d.value
      }));
      
      // Buscar despesas do período
      despesasFatura = await Expense.findAll({
        where: {
          user_id: userId,
          credit_card_id: card.id,
          // Usar data da compra (due_date) dentro do período inclusivo
          due_date: { [Op.between]: [periodoFatura.start, periodoFatura.end] },
          status: { [Op.ne]: 'paga' },
        },
      });
      
      console.log('[PAGAMENTO] Despesas encontradas no período para pagamento:', despesasFatura.length);
      despesasFatura.forEach(d => console.log('  ', {
        id: d.id,
        description: d.description,
        createdAt: d.createdAt,
        created_at: d.dataValues.created_at || 'n/a',
        status: d.status,
        valor: d.value
      }));
      
      valorPagamento = despesasFatura.reduce((acc, d) => acc + Number(d.value), 0);
      console.log('[PAGAMENTO] Valor total calculado para pagamento:', valorPagamento);
    }
    // Impedir pagamento com valor inválido ou zero
    if (!isFinite(valorPagamento) || Number(valorPagamento) <= 0) {
      return res.status(400).json({ error: 'Não há despesas a pagar no período selecionado ou valor inválido.' });
    }
    // Debita valor da conta
    if (account.balance < valorPagamento) {
      return res.status(400).json({ error: 'Saldo insuficiente na conta' });
    }
    await account.update({ balance: account.balance - valorPagamento });
    
    // Registra pagamento (somente em CreditCardPayment; não criar Expense para evitar duplicação no extrato)
    const payment = await CreditCardPayment.create({
      card_id: card.id,
      user_id: userId,
      account_id,
      value: valorPagamento,
      payment_date: payment_date || new Date(),
      is_full_payment: !!is_full_payment,
      auto_debit: !!auto_debit,
    });
    
    // Atualiza despesas do período como pagas
    if (is_full_payment && periodoFatura) {
      await Promise.all(despesasFatura.map(despesa => despesa.update({ status: 'paga', paid_at: payment_date || new Date() })));
    }
    // Atualiza débito automático do cartão se solicitado
    if (auto_debit !== undefined) {
      await card.update({ debito_automatico: !!auto_debit, conta_debito_id: account_id });
    }
    res.status(201).json(payment);
  } catch (err) {
    console.error('Erro ao pagar fatura:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.setAutoDebit = async (req, res) => {
  try {
    const { auto_debit, account_id } = req.body;
    const userId = req.user.id;
    const cardId = req.params.id;
    const card = await CreditCard.findOne({ where: { id: cardId, user_id: userId } });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    if (auto_debit && !account_id) {
      return res.status(400).json({ error: 'É necessário informar a conta para débito automático.' });
    }
    await card.update({ debito_automatico: !!auto_debit, conta_debito_id: auto_debit ? account_id : null });
    res.json({ success: true, debito_automatico: !!auto_debit, conta_debito_id: auto_debit ? account_id : null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
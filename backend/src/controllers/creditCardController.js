const { CreditCard, Expense, CreditCardPayment, Account } = require('../models');
const { Op } = require('sequelize');

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
  // A fatura atual é a que fecha no mês atual (se ainda não fechou) ou no mês anterior (se já fechou)
  let currentClosing = new Date(year, month, closingDay);
  if (refDate.getDate() >= closingDay) {
    // Já fechou a fatura do mês atual, então a próxima fatura fecha no próximo mês
    currentClosing = new Date(year, month + 1, closingDay);
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
        due_date: { [Op.gte]: periods.atual.start, [Op.lt]: periods.atual.end },
        status: { [Op.ne]: 'paga' }, // Só despesas em aberto
      },
    });
    console.log('[getBill] Despesas fatura atual:', atual);
    // Próxima fatura
    const proxima = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        due_date: { [Op.gte]: periods.proxima.start, [Op.lt]: periods.proxima.end },
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
        const periodo = getBillPeriodForMonth(closingDay, ano, mes - 1); // mes - 1 porque getBillPeriodForMonth usa 0-11
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
      despesasFatura = await Expense.findAll({
        where: {
          user_id: userId,
          credit_card_id: card.id,
          due_date: { [Op.gte]: periodoFatura.start, [Op.lt]: periodoFatura.end },
        },
      });
      console.log('[PAGAMENTO] Despesas encontradas para pagamento:', despesasFatura.map(d => ({ id: d.id, due_date: d.due_date, status: d.status, valor: d.value })));
      valorPagamento = despesasFatura.reduce((acc, d) => acc + Number(d.value), 0);
      console.log('[PAGAMENTO] Valor total calculado para pagamento:', valorPagamento);
    }
    // Debita valor da conta
    if (account.balance < valorPagamento) {
      return res.status(400).json({ error: 'Saldo insuficiente na conta' });
    }
    await account.update({ balance: account.balance - valorPagamento });
    // Registra pagamento
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
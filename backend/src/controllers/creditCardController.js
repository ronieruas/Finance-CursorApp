const { CreditCard, Expense, CreditCardPayment, Account } = require('../models');
const { Op } = require('sequelize');

function getBillPeriods(closingDay, dueDay, refDate = new Date()) {
  // Regra: Fechamento ocorre antes do vencimento
  // A fatura com vencimento no mês M inclui despesas de:
  // start = dia 'closingDay' de M-2 (00:00:00) até end = dia anterior ao 'closingDay' de M-1 (23:59:59.999)
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-11
  const day = refDate.getDate();

  // A fatura "atual" é a que vence neste mês se ainda não passou do dia de vencimento
  // e a do próximo mês se o dia atual já passou do vencimento.
  let dueYearAtual = year;
  let dueMonthAtual;
  if (day > dueDay) {
    // Já passou do vencimento deste mês -> fatura atual é a do próximo mês
    dueMonthAtual = month + 1;
    if (dueMonthAtual > 11) { dueMonthAtual = 0; dueYearAtual += 1; }
  } else {
    // Ainda não passou do vencimento -> fatura atual é a que vence neste mês
    dueMonthAtual = month;
  }

  // Próxima fatura é o mês seguinte ao dueMonthAtual
  let dueYearProxima = dueYearAtual;
  let dueMonthProxima = dueMonthAtual + 1;
  if (dueMonthProxima > 11) { dueMonthProxima = 0; dueYearProxima += 1; }

  const atual = getBillPeriodForMonth(closingDay, dueDay, dueYearAtual, dueMonthAtual);
  const proxima = getBillPeriodForMonth(closingDay, dueDay, dueYearProxima, dueMonthProxima);

  return { atual, proxima };
}

function getBillPeriodForMonth(closingDay, dueDay, year, month) {
  // month é 0-11 e representa o MÊS DE VENCIMENTO da fatura
  const vencimento = new Date(year, month, dueDay);

  let start;
  let end;
  if (closingDay > dueDay) {
    // Fechamento ocorre no mês anterior ao vencimento
    // Ex.: vence em agosto (month=7), período: closingDay de (junho, month-2) até (closingDay-1) de (julho, month-1)
    start = new Date(year, month - 2, closingDay);
    start.setHours(0, 0, 0, 0);
    end = new Date(year, month - 1, closingDay - 1);
    end.setHours(23, 59, 59, 999);
  } else {
    // Fechamento ocorre no mesmo mês do vencimento
    // Ex.: vence em agosto (month=7), período: closingDay de (julho, month-1) até (closingDay-1) de (agosto, month)
    start = new Date(year, month - 1, closingDay);
    start.setHours(0, 0, 0, 0);
    end = new Date(year, month, closingDay - 1);
    end.setHours(23, 59, 59, 999);
  }

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

const formatDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

    const atualStart = formatDateOnly(periods.atual.start);
    const atualEnd = formatDateOnly(periods.atual.end);
    const proximaStart = formatDateOnly(periods.proxima.start);
    const proximaEnd = formatDateOnly(periods.proxima.end);

    console.log('[getBill] Filtro atual (due_date):', atualStart, '->', atualEnd);
    // Fatura atual
    const atual = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        due_date: { [Op.between]: [atualStart, atualEnd] },
        status: { [Op.ne]: 'paga' },
      },
    });
    console.log('[getBill] Despesas fatura atual:', atual?.length || 0);

    console.log('[getBill] Filtro próxima (due_date):', proximaStart, '->', proximaEnd);
    // Próxima fatura
    const proxima = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        due_date: { [Op.between]: [proximaStart, proximaEnd] },
      },
    });
    console.log('[getBill] Despesas próxima fatura:', proxima?.length || 0);

    res.json({
      atual: Array.isArray(atual) ? atual : [],
      proxima: Array.isArray(proxima) ? proxima : [],
      periods: {
        atual: {
          start: periods.atual.start.toISOString(),
          end: periods.atual.end.toISOString(),
          start_date: atualStart,
          end_date: atualEnd,
        },
        proxima: {
          start: periods.proxima.start.toISOString(),
          end: periods.proxima.end.toISOString(),
          start_date: proximaStart,
          end_date: proximaEnd,
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
    const card = await CreditCard.findOne({ where: { id: cardId, user_id: userId } });
    if (!card) return res.status(404).json({ error: 'Cartão não encontrado' });
    const account = await Account.findOne({ where: { id: account_id, user_id: userId } });
    if (!account) return res.status(404).json({ error: 'Conta não encontrada' });

    let valorPagamento = Number(value);
    let despesasFatura = [];
    let periodoFatura = null;
    if (is_full_payment) {
      let periods;
      if (bill_month) {
        const [ano, mes] = bill_month.split('-').map(Number);
        const periodo = getBillPeriodForMonth(card.closing_day, card.due_day, ano, mes - 1);
        periods = { atual: periodo };
      } else {
        periods = getBillPeriods(card.closing_day, card.due_day);
      }
      periodoFatura = periods.atual;
      const startStr = formatDateOnly(periodoFatura.start);
      const endStr = formatDateOnly(periodoFatura.end);
      console.log('[PAGAMENTO] Filtro período (due_date):', startStr, '->', endStr, 'bill_month:', bill_month);

      // Todas as despesas do cartão (debug)
      const todasDespesas = await Expense.findAll({ where: { user_id: userId, credit_card_id: card.id } });
      console.log('[PAGAMENTO] Total de despesas do cartão (sem filtro):', todasDespesas.length);

      despesasFatura = await Expense.findAll({
        where: {
          user_id: userId,
          credit_card_id: card.id,
          due_date: { [Op.between]: [startStr, endStr] },
          status: { [Op.ne]: 'paga' },
        },
      });
      console.log('[PAGAMENTO] Despesas no período encontradas:', despesasFatura.length);

      valorPagamento = despesasFatura.reduce((acc, d) => acc + Number(d.value), 0);
      console.log('[PAGAMENTO] Valor total calculado para pagamento:', valorPagamento);
    }

    if (!isFinite(valorPagamento) || Number(valorPagamento) <= 0) {
      return res.status(400).json({ error: 'Não há despesas a pagar no período selecionado ou valor inválido.' });
    }
    if (account.balance < valorPagamento) {
      return res.status(400).json({ error: 'Saldo insuficiente na conta' });
    }

    await account.update({ balance: account.balance - valorPagamento });

    const payment = await CreditCardPayment.create({
      card_id: card.id,
      user_id: userId,
      account_id,
      value: valorPagamento,
      payment_date: payment_date || new Date(),
      is_full_payment: !!is_full_payment,
      auto_debit: !!auto_debit,
    });

    if (is_full_payment && periodoFatura) {
      await Promise.all(despesasFatura.map(despesa => despesa.update({ status: 'paga', paid_at: payment_date || new Date() })));
    }
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
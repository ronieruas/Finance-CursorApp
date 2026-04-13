const { CreditCard, Expense, CreditCardPayment, Account, FinancialAuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Utilidades para tratar datas "date-only" vindas do front (YYYY-MM-DD)
const isDateOnly = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const toLocalDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d); // constrói no fuso local (evita voltar 1 dia)
};

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
  if (Number(closingDay) > Number(dueDay)) {
    start = new Date(year, month - 2, closingDay);
    end = new Date(year, month - 1, Math.max(Number(closingDay) - 1, 1));
  } else {
    start = new Date(year, month - 1, closingDay);
    end = new Date(year, month, Math.max(Number(closingDay) - 1, 1));
  }
  start.setHours(0, 0, 0, 0);
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
    const atualVencimento = formatDateOnly(periods.atual.vencimento);
    const proximaVencimento = formatDateOnly(periods.proxima.vencimento);

    console.log('[getBill] Filtro atual (período ou vencimento):', { atualStart, atualEnd, atualVencimento });
    const atual = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        status: { [Op.ne]: 'paga' },
        [Op.or]: [
          { due_date: { [Op.between]: [atualStart, atualEnd] } },
          { due_date: atualVencimento },
        ],
      },
    });
    console.log('[getBill] Despesas fatura atual:', atual?.length || 0);

    console.log('[getBill] Filtro próxima (período ou vencimento):', { proximaStart, proximaEnd, proximaVencimento });
    const proxima = await Expense.findAll({
      where: {
        user_id: req.user.id,
        credit_card_id: card.id,
        status: { [Op.ne]: 'paga' },
        [Op.or]: [
          { due_date: { [Op.between]: [proximaStart, proximaEnd] } },
          { due_date: proximaVencimento },
        ],
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
          vencimento_date: atualVencimento,
        },
        proxima: {
          start: periods.proxima.start.toISOString(),
          end: periods.proxima.end.toISOString(),
          start_date: proximaStart,
          end_date: proximaEnd,
          vencimento_date: proximaVencimento,
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
    console.log('[PAGAMENTO] Body completo recebido:', JSON.stringify(req.body, null, 2));
    const { account_id, value, payment_date, is_full_payment, auto_debit, bill_month } = req.body;
    console.log('[PAGAMENTO] payment_date extraído:', payment_date);
    console.log('[PAGAMENTO] Tipo do payment_date:', typeof payment_date);
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
      const vencStr = formatDateOnly(periodoFatura.vencimento);
      console.log('[PAGAMENTO] Filtro por período ou vencimento:', { startStr, endStr, vencStr, bill_month });

      const todasDespesas = await Expense.findAll({ where: { user_id: userId, credit_card_id: card.id } });
      console.log('[PAGAMENTO] Total de despesas do cartão (sem filtro):', todasDespesas.length);

      despesasFatura = await Expense.findAll({
        where: {
          user_id: userId,
          credit_card_id: card.id,
          status: { [Op.ne]: 'paga' },
          [Op.or]: [
            { due_date: { [Op.between]: [startStr, endStr] } },
            { due_date: vencStr },
          ],
        },
      });
      console.log('[PAGAMENTO] Despesas na fatura encontradas:', despesasFatura.length);

      valorPagamento = despesasFatura.reduce((acc, d) => acc + Number(d.value), 0);
      console.log('[PAGAMENTO] Valor total calculado para pagamento:', valorPagamento);
    }

    if (!isFinite(valorPagamento) || Number(valorPagamento) <= 0) {
      return res.status(400).json({ error: 'Não há despesas a pagar no período selecionado ou valor inválido.' });
    }
    const normalizeDateOnly = (input) => {
      if (!input) return formatDateOnly(new Date());
      const s = String(input).trim();
      // Já está no formato YYYY-MM-DD
      const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m1) return s;
      // Formato brasileiro DD/MM/YYYY
      const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m2) return `${m2[3]}-${m2[2]}-${m2[1]}`;
      // Tentar interpretar como data e converter para YYYY-MM-DD
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) return formatDateOnly(dt);
      // Fallback via dayjs (casos ISO completos)
      return dayjs(s).format('YYYY-MM-DD');
    };

    const paymentDateFormatted = normalizeDateOnly(payment_date);
    console.log('Data normalizada para salvar (YYYY-MM-DD):', paymentDateFormatted);

    let createdPayment;
    await sequelize.transaction(async (t) => {
      const lockedAccount = await Account.findOne({
        where: { id: account_id, user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!lockedAccount) {
        const err = new Error('Conta não encontrada');
        err.statusCode = 404;
        throw err;
      }

      const existingPayment = await CreditCardPayment.findOne({
        where: {
          card_id: card.id,
          user_id: userId,
          account_id,
          value: valorPagamento,
          payment_date: paymentDateFormatted,
        },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (existingPayment) {
        const err = new Error('Pagamento duplicado detectado. Operação cancelada.');
        err.statusCode = 409;
        throw err;
      }

      if (Number(lockedAccount.balance) < Number(valorPagamento)) {
        const err = new Error('Saldo insuficiente na conta');
        err.statusCode = 400;
        throw err;
      }

      await lockedAccount.update(
        { balance: Number(lockedAccount.balance) - Number(valorPagamento) },
        { transaction: t }
      );

      createdPayment = await CreditCardPayment.create(
        {
          card_id: card.id,
          user_id: userId,
          account_id,
          value: valorPagamento,
          payment_date: paymentDateFormatted,
          is_full_payment: !!is_full_payment,
          auto_debit: !!auto_debit,
        },
        { transaction: t }
      );

      if (is_full_payment && periodoFatura) {
        const paidAtLocal = toLocalDate(paymentDateFormatted);
        const ids = despesasFatura.map((d) => d.id);
        if (ids.length) {
          await Expense.update(
            { status: 'paga', paid_at: paidAtLocal },
            { where: { id: { [Op.in]: ids }, user_id: userId }, transaction: t }
          );
        }
      }

      if (auto_debit !== undefined) {
        await card.update({ debito_automatico: !!auto_debit, conta_debito_id: account_id }, { transaction: t });
      }

      try {
        await FinancialAuditLog.create(
          {
            user_id: userId,
            action: 'credit_card_payment_created',
            entity_type: 'credit_card_payment',
            entity_id: createdPayment.id,
            details: JSON.stringify({
              card_id: card.id,
              account_id,
              value: String(valorPagamento),
              payment_date: paymentDateFormatted,
              is_full_payment: !!is_full_payment,
              bill_month: bill_month || null,
            }),
          },
          { transaction: t }
        );
      } catch {}
    });

    res.status(201).json(createdPayment);
  } catch (err) {
    console.error('Erro ao pagar fatura:', err);
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
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

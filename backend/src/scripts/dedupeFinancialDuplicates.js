const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { Account, CreditCard, Expense, CreditCardPayment, FinancialAuditLog, sequelize } = require('../models');

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function monthRange(now = new Date()) {
  const start = dayjs(now).startOf('month').format('YYYY-MM-DD');
  const end = dayjs(now).endOf('month').format('YYYY-MM-DD');
  return { start, end };
}

function normalizeDesc(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function normalizeMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return (Math.round(n * 100) / 100).toFixed(2);
}

async function collectDuplicateExpenseIds({ from, to, transaction, mode }) {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    const isFuzzy = mode === 'fuzzy';
    const isSeries = mode === 'series';
    const isMonth = mode === 'month';
    const isMonthDesc = mode === 'month_desc';
    const [rows] = await sequelize.query(
      `
      WITH ranked AS (
        SELECT
          id,
          user_id,
          account_id,
          credit_card_id,
          due_date,
          description,
          value,
          status,
          ROW_NUMBER() OVER (
            PARTITION BY
              user_id,
              account_id,
              credit_card_id,
              ${isMonth || isMonthDesc ? "date_trunc('month', due_date)" : 'due_date'},
              ${isFuzzy || isSeries || isMonth || isMonthDesc ? "lower(regexp_replace(trim(description), '\\\\s+', ' ', 'g'))" : 'description'},
              ${isSeries || isMonthDesc ? 'NULL' : (isFuzzy ? 'round(value::numeric, 2)' : 'value')},
              ${isMonthDesc ? 'NULL' : 'COALESCE(installment_number, 1)'},
              ${isMonthDesc ? 'NULL' : 'COALESCE(installment_total, 1)'}
            ORDER BY
              CASE WHEN status = 'paga' THEN 0 ELSE 1 END,
              ${isMonth || isMonthDesc ? 'due_date DESC,' : ''}
              id
          ) AS rn
        FROM expenses
        WHERE due_date BETWEEN :from AND :to
      )
      SELECT * FROM ranked WHERE rn > 1;
      `,
      { replacements: { from, to }, transaction }
    );
    return rows;
  }

  const rows = await Expense.findAll({
    where: { due_date: { [Op.between]: [from, to] } },
    attributes: ['id', 'user_id', 'account_id', 'credit_card_id', 'due_date', 'description', 'value', 'status', 'installment_number', 'installment_total'],
    order: [['id', 'ASC']],
    transaction,
  });

  if (mode === 'month_desc') {
    const groups = new Map();
    for (const r of rows) {
      const monthKey = dayjs(r.due_date).format('YYYY-MM');
      const key = [
        r.user_id,
        r.account_id || 0,
        r.credit_card_id || 0,
        monthKey,
        normalizeDesc(r.description),
      ].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const dups = [];
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      const paid = list.filter((x) => x.status === 'paga').sort((a, b) => (a.due_date > b.due_date ? -1 : 1) || (a.id - b.id));
      const keep = paid[0] || list.slice().sort((a, b) => (a.due_date > b.due_date ? -1 : 1) || (a.id - b.id))[0];
      for (const item of list) {
        if (item.id !== keep.id) dups.push(item.toJSON());
      }
    }
    return dups;
  }

  if (mode === 'month') {
    const groups = new Map();
    for (const r of rows) {
      const monthKey = dayjs(r.due_date).format('YYYY-MM');
      const key = [
        r.user_id,
        r.account_id || 0,
        r.credit_card_id || 0,
        monthKey,
        normalizeDesc(r.description),
        r.installment_number || 1,
        r.installment_total || 1,
      ].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const dups = [];
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      const paid = list.filter((x) => x.status === 'paga').sort((a, b) => (a.due_date > b.due_date ? -1 : 1) || (a.id - b.id));
      const keep = paid[0] || list.slice().sort((a, b) => (a.due_date > b.due_date ? -1 : 1) || (a.id - b.id))[0];
      for (const item of list) {
        if (item.id !== keep.id) dups.push(item.toJSON());
      }
    }
    return dups;
  }

  if (mode === 'series') {
    const groups = new Map();
    for (const r of rows) {
      const key = [
        r.user_id,
        r.account_id || 0,
        r.credit_card_id || 0,
        r.due_date,
        normalizeDesc(r.description),
        r.installment_number || 1,
        r.installment_total || 1,
      ].join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    }

    const dups = [];
    for (const list of groups.values()) {
      if (list.length <= 1) continue;
      const paid = list.filter((x) => x.status === 'paga').sort((a, b) => a.id - b.id);
      const keep = (paid[0] || list.slice().sort((a, b) => a.id - b.id)[0]);
      for (const item of list) {
        if (item.id !== keep.id) dups.push(item.toJSON());
      }
    }
    return dups;
  }

  const seen = new Set();
  const dups = [];
  for (const r of rows) {
    const desc = mode === 'fuzzy' ? normalizeDesc(r.description) : r.description;
    const money = mode === 'fuzzy' ? normalizeMoney(r.value) : String(r.value);
    const key = [
      r.user_id,
      r.account_id || 0,
      r.credit_card_id || 0,
      r.due_date,
      desc,
      money,
      r.installment_number || 1,
      r.installment_total || 1,
    ].join('|');
    if (seen.has(key)) dups.push(r.toJSON());
    else seen.add(key);
  }
  return dups;
}

async function collectDuplicatePaymentIds({ from, to, transaction, mode }) {
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    const isFuzzy = mode === 'fuzzy';
    const [rows] = await sequelize.query(
      `
      WITH ranked AS (
        SELECT
          id,
          user_id,
          account_id,
          card_id,
          payment_date,
          value,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, account_id, card_id, payment_date, ${isFuzzy ? 'round(value::numeric, 2)' : 'value'}
            ORDER BY id
          ) AS rn
        FROM credit_card_payments
        WHERE payment_date BETWEEN :from AND :to
      )
      SELECT * FROM ranked WHERE rn > 1;
      `,
      { replacements: { from, to }, transaction }
    );
    return rows;
  }

  const rows = await CreditCardPayment.findAll({
    where: { payment_date: { [Op.between]: [from, to] } },
    attributes: ['id', 'user_id', 'account_id', 'card_id', 'payment_date', 'value'],
    order: [['id', 'ASC']],
    transaction,
  });

  const seen = new Set();
  const dups = [];
  for (const r of rows) {
    const money = mode === 'fuzzy' ? normalizeMoney(r.value) : String(r.value);
    const key = [r.user_id, r.account_id, r.card_id, r.payment_date, money].join('|');
    if (seen.has(key)) dups.push(r.toJSON());
    else seen.add(key);
  }
  return dups;
}

async function dedupeFinancialDuplicates({ from, to, mode = 'strict' } = {}) {
  const range = monthRange(new Date());
  const start = from || range.start;
  const end = to || range.end;

  const result = {
    from: start,
    to: end,
    deleted_expenses: 0,
    deleted_payments: 0,
    refunded_accounts: 0,
    adjusted_cards: 0,
  };

  await sequelize.transaction(async (t) => {
    const duplicateExpenses = await collectDuplicateExpenseIds({ from: start, to: end, transaction: t, mode });
    const duplicatePayments = await collectDuplicatePaymentIds({ from: start, to: end, transaction: t, mode });

    const refundByAccount = new Map();
    const cardAdjustByCard = new Map();

    for (const row of duplicateExpenses) {
      if (row.account_id && row.status === 'paga') {
        const key = `${row.user_id}:${row.account_id}`;
        refundByAccount.set(key, (refundByAccount.get(key) || 0) + Number(row.value));
      }
      if (row.credit_card_id) {
        const key = `${row.user_id}:${row.credit_card_id}`;
        cardAdjustByCard.set(key, (cardAdjustByCard.get(key) || 0) - Number(row.value));
      }
    }

    for (const row of duplicatePayments) {
      if (row.account_id) {
        const key = `${row.user_id}:${row.account_id}`;
        refundByAccount.set(key, (refundByAccount.get(key) || 0) + Number(row.value));
      }
    }

    for (const [key, amount] of refundByAccount.entries()) {
      const [userIdStr, accountIdStr] = key.split(':');
      const user_id = Number(userIdStr);
      const account_id = Number(accountIdStr);
      const account = await Account.findOne({ where: { id: account_id, user_id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!account) continue;
      account.balance = Number(account.balance) + Number(amount);
      await account.save({ transaction: t });
      result.refunded_accounts += 1;
    }

    for (const [key, amount] of cardAdjustByCard.entries()) {
      const [userIdStr, cardIdStr] = key.split(':');
      const user_id = Number(userIdStr);
      const card_id = Number(cardIdStr);
      const card = await CreditCard.findOne({ where: { id: card_id, user_id }, transaction: t, lock: t.LOCK.UPDATE });
      if (!card) continue;
      const next = (Number(card.used_limit) || 0) + Number(amount);
      await card.update({ used_limit: next < 0 ? 0 : next }, { transaction: t });
      result.adjusted_cards += 1;
    }

    const expenseIds = duplicateExpenses.map((r) => r.id);
    const paymentIds = duplicatePayments.map((r) => r.id);

    if (expenseIds.length) {
      await Expense.destroy({ where: { id: { [Op.in]: expenseIds } }, transaction: t });
      result.deleted_expenses = expenseIds.length;
    }
    if (paymentIds.length) {
      await CreditCardPayment.destroy({ where: { id: { [Op.in]: paymentIds } }, transaction: t });
      result.deleted_payments = paymentIds.length;
    }

    try {
      await FinancialAuditLog.create(
        {
          action: 'dedupe_financial_duplicates',
          details: JSON.stringify({
            from: start,
            to: end,
            mode,
            deleted_expense_ids: expenseIds,
            deleted_payment_ids: paymentIds,
            refunds: [...refundByAccount.entries()],
            card_adjustments: [...cardAdjustByCard.entries()],
          }),
        },
        { transaction: t }
      );
    } catch {}
  });

  return result;
}

if (require.main === module) {
  const args = parseArgs(process.argv);
  dedupeFinancialDuplicates({ from: args.from, to: args.to, mode: args.mode || 'strict' })
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { dedupeFinancialDuplicates };

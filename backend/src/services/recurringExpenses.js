const dayjs = require('dayjs');
const { Op } = require('sequelize');
const { nextOccurrenceAfter, normalizeFrequency, normalizeInterval, toISODateOnly } = require('./recurringIncomes');

const UNIT_BY_FREQUENCY = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

function periodRange(dateStr, unit) {
  const d = dayjs(dateStr);
  if (!d.isValid()) return null;
  return {
    start: d.startOf(unit).format('YYYY-MM-DD'),
    end: d.endOf(unit).format('YYYY-MM-DD'),
  };
}

function buildSeriesWhere(expense) {
  const seriesId = expense.recurrence_id || expense.id;
  return {
    user_id: expense.user_id,
    is_recurring: true,
    [Op.or]: [
      { recurrence_id: seriesId },
      { id: seriesId },
    ],
  };
}

function buildSeriesSignatureWhere(expense) {
  return {
    user_id: expense.user_id,
    is_recurring: true,
    account_id: expense.account_id ?? null,
    credit_card_id: expense.credit_card_id ?? null,
    description: expense.description,
    auto_debit: expense.auto_debit ?? false,
    installment_number: expense.installment_number ?? 1,
    installment_total: expense.installment_total ?? 1,
  };
}

function normalizeDesc(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function parseExceptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function serializeExceptions(values) {
  const unique = [...new Set((values || []).map(toISODateOnly).filter(Boolean))].sort();
  return unique.length ? JSON.stringify(unique) : null;
}

async function reverseExpenseImpact({ item, Account, CreditCard }) {
  if (item.account_id && item.status === 'paga' && Account) {
    const account = await Account.findOne({ where: { id: item.account_id, user_id: item.user_id } });
    if (account) {
      account.balance = Number(account.balance) + Number(item.value);
      await account.save();
    }
  }

  if (item.credit_card_id && CreditCard) {
    const card = await CreditCard.findOne({ where: { id: item.credit_card_id, user_id: item.user_id } });
    if (card) {
      card.used_limit = (Number(card.used_limit) || 0) - Number(item.value);
      await card.save();
    }
  }
}

async function deleteRecurringExpenseOccurrenceOnly({ expense, Expense, Account, CreditCard }) {
  if (!expense || !expense.is_recurring) {
    return { deleted: 0 };
  }

  const seriesWhere = buildSeriesWhere(expense);
  const signatureWhere = buildSeriesSignatureWhere(expense);
  const currentExceptions = parseExceptions(expense.recurrence_exceptions).map(toISODateOnly).filter(Boolean);
  const nextExceptions = serializeExceptions([...currentExceptions, expense.due_date]);
  const frequency = normalizeFrequency(expense.recurrence_frequency) || 'monthly';
  const interval = normalizeInterval(expense.recurrence_interval);
  const nextDueDateStr = nextOccurrenceAfter(expense.due_date, frequency, interval, expense.due_date);
  const hasOtherOccurrences = await Expense.count({
    where: {
      ...seriesWhere,
      id: { [Op.ne]: expense.id },
    },
  });

  await Expense.update(
    {
      recurrence_id: expense.recurrence_id || expense.id,
      recurrence_exceptions: nextExceptions,
    },
    { where: seriesWhere }
  );

  if (!hasOtherOccurrences) {
    const until = expense.recurrence_until ? dayjs(expense.recurrence_until) : null;
    if (nextDueDateStr && (!until || !dayjs(nextDueDateStr).isAfter(until, 'day')) && !currentExceptions.includes(nextDueDateStr)) {
      const unit = UNIT_BY_FREQUENCY[frequency] || 'month';
      const range = periodRange(nextDueDateStr, unit);
      const existsInPeriod = range
        ? await Expense.findOne({
            where: {
              ...signatureWhere,
              due_date: { [Op.between]: [range.start, range.end] },
            },
          })
        : null;
      if (existsInPeriod) {
        await reverseExpenseImpact({ item: expense, Account, CreditCard });
        await expense.destroy();
        return { deleted: 1 };
      }
      try {
        await Expense.create({
          user_id: expense.user_id,
          account_id: expense.account_id,
          credit_card_id: expense.credit_card_id,
          description: expense.description,
          value: expense.value,
          due_date: nextDueDateStr,
          category: expense.category,
          status: 'pendente',
          is_recurring: true,
          recurrence_id: expense.recurrence_id || expense.id,
          recurrence_frequency: frequency,
          recurrence_interval: interval,
          recurrence_until: expense.recurrence_until,
          recurrence_exceptions: nextExceptions,
          auto_debit: expense.auto_debit,
          installment_number: expense.installment_number,
          installment_total: expense.installment_total,
        });
      } catch (err) {
        if (!err || err.name !== 'SequelizeUniqueConstraintError') throw err;
      }
    }
  }

  await reverseExpenseImpact({ item: expense, Account, CreditCard });
  await expense.destroy();

  return { deleted: 1 };
}

async function stopRecurringExpenseSeriesFrom({ expense, Expense, Account, CreditCard }) {
  if (!expense || !expense.is_recurring) {
    return { deleted: 0 };
  }

  const seriesWhere = buildSeriesWhere(expense);
  const affected = await Expense.findAll({
    where: {
      ...seriesWhere,
      due_date: { [Op.gte]: expense.due_date },
    },
    order: [['due_date', 'ASC'], ['id', 'ASC']],
  });

  const previous = await Expense.findOne({
    where: {
      ...seriesWhere,
      due_date: { [Op.lt]: expense.due_date },
    },
    order: [['due_date', 'DESC'], ['id', 'DESC']],
  });

  if (previous) {
    await Expense.update(
      {
        recurrence_until: previous.due_date,
        recurrence_id: expense.recurrence_id || expense.id,
      },
      { where: seriesWhere }
    );
  }

  for (const item of affected) {
    await reverseExpenseImpact({ item, Account, CreditCard });
  }

  if (affected.length) {
    await Expense.destroy({ where: { id: { [Op.in]: affected.map((item) => item.id) } } });
  }

  return { deleted: affected.length };
}

async function deleteRecurringExpenseSeries({ expense, Expense, Account, CreditCard }) {
  if (!expense || !expense.is_recurring) {
    return { deleted: 0 };
  }

  const seriesWhere = buildSeriesWhere(expense);
  const affected = await Expense.findAll({
    where: seriesWhere,
    order: [['due_date', 'ASC'], ['id', 'ASC']],
  });

  for (const item of affected) {
    await reverseExpenseImpact({ item, Account, CreditCard });
  }

  if (affected.length) {
    await Expense.destroy({ where: { id: { [Op.in]: affected.map((item) => item.id) } } });
  }

  return { deleted: affected.length };
}

async function ensureRecurringExpensesThrough({ userId, throughDate, Expense, now = new Date() }) {
  const through = toISODateOnly(throughDate);
  if (!userId || !through) return { created: 0 };

  const todayStr = dayjs(now).format('YYYY-MM-DD');
  if (dayjs(through).isBefore(todayStr, 'day')) return { created: 0 };

  const recurring = await Expense.findAll({
    where: {
      user_id: userId,
      is_recurring: true,
      account_id: { [Op.ne]: null },
      credit_card_id: null,
    },
    order: [['due_date', 'DESC'], ['id', 'DESC']],
  });

  const latestByKey = new Map();
  for (const exp of recurring) {
    const key = [
      exp.user_id,
      exp.account_id || 0,
      exp.credit_card_id || 0,
      normalizeDesc(exp.description),
      exp.auto_debit ? 1 : 0,
      exp.installment_number || 1,
      exp.installment_total || 1,
    ].join('|');

    if (!latestByKey.has(key)) latestByKey.set(key, exp);
  }

  let created = 0;
  for (const latest of latestByKey.values()) {
    const seriesId = latest.recurrence_id || latest.id;
    const signatureWhere = buildSeriesSignatureWhere(latest);

    const frequency = normalizeFrequency(latest.recurrence_frequency) || 'monthly';
    const interval = normalizeInterval(latest.recurrence_interval);
    const unit = UNIT_BY_FREQUENCY[frequency] || 'month';
    const untilStr = toISODateOnly(latest.recurrence_until);
    const until = untilStr ? dayjs(untilStr) : null;
    const exceptions = new Set(parseExceptions(latest.recurrence_exceptions).map(toISODateOnly).filter(Boolean));

    let nextStr = nextOccurrenceAfter(latest.due_date, frequency, interval, latest.due_date);
    while (nextStr && (dayjs(nextStr).isBefore(through, 'day') || dayjs(nextStr).isSame(through, 'day'))) {
      if (until && dayjs(nextStr).isAfter(until, 'day')) break;
      if (exceptions.has(nextStr)) {
        nextStr = dayjs(nextStr).add(interval, { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[frequency]).format('YYYY-MM-DD');
        continue;
      }

      const range = periodRange(nextStr, unit);
      const existing = range
        ? await Expense.findOne({
            where: {
              ...signatureWhere,
              due_date: { [Op.between]: [range.start, range.end] },
            },
          })
        : await Expense.findOne({
            where: {
              ...signatureWhere,
              due_date: nextStr,
            },
          });

      if (!existing) {
        try {
          const createdExpense = await Expense.create({
            user_id: userId,
            account_id: latest.account_id,
            credit_card_id: latest.credit_card_id,
            description: latest.description,
            value: latest.value,
            due_date: nextStr,
            category: latest.category,
            status: 'pendente',
            is_recurring: true,
            recurrence_id: seriesId,
            recurrence_frequency: frequency,
            recurrence_interval: interval,
            recurrence_until: untilStr,
            recurrence_exceptions: latest.recurrence_exceptions,
            auto_debit: latest.auto_debit,
            installment_number: latest.installment_number,
            installment_total: latest.installment_total,
            paid_at: null,
          });
          if (!createdExpense.recurrence_id) {
            await createdExpense.update({ recurrence_id: createdExpense.id });
          }
          created += 1;
        } catch (err) {
          if (!err || err.name !== 'SequelizeUniqueConstraintError') throw err;
        }
      }

      nextStr = dayjs(nextStr).add(interval, { daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' }[frequency]).format('YYYY-MM-DD');
    }
  }

  return { created };
}

async function generateNextRecurringExpenses({ Expense, now = new Date(), horizonMonths = 1 }) {
  const horizon = dayjs(now).add(horizonMonths, 'month').endOf('month').format('YYYY-MM-DD');
  const users = await Expense.findAll({
    where: { is_recurring: true, account_id: { [Op.ne]: null }, credit_card_id: null },
    attributes: ['user_id'],
    group: ['user_id'],
  });

  let created = 0;
  for (const u of users) {
    const userId = u.user_id;
    if (!userId) continue;
    const r = await ensureRecurringExpensesThrough({ userId, throughDate: horizon, Expense, now });
    created += r.created || 0;
  }

  return { created, horizon };
}

module.exports = {
  deleteRecurringExpenseOccurrenceOnly,
  deleteRecurringExpenseSeries,
  ensureRecurringExpensesThrough,
  generateNextRecurringExpenses,
  stopRecurringExpenseSeriesFrom,
};

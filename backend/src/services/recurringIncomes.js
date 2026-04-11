const dayjs = require('dayjs');
const { Op } = require('sequelize');

const UNIT_BY_FREQUENCY = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

function normalizeFrequency(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  return UNIT_BY_FREQUENCY[v] ? v : null;
}

function normalizeInterval(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  const i = Math.floor(n);
  return i >= 1 ? i : 1;
}

function toISODateOnly(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = dayjs(s);
  return d.isValid() ? d.format('YYYY-MM-DD') : null;
}

function parseExceptions(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(toISODateOnly).filter(Boolean);
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(toISODateOnly).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function serializeExceptions(values) {
  const unique = [...new Set((values || []).map(toISODateOnly).filter(Boolean))].sort();
  return unique.length ? JSON.stringify(unique) : null;
}

function getIncomeSeriesWhere(income) {
  const seriesId = income.recurrence_id || income.id;
  return {
    user_id: income.user_id,
    is_recurring: true,
    [Op.or]: [
      { recurrence_id: seriesId },
      { id: seriesId },
    ],
  };
}

function nextOccurrenceAfter(lastDateStr, frequency, interval, afterDateStr) {
  const unit = UNIT_BY_FREQUENCY[frequency];
  if (!unit) return null;

  const last = dayjs(lastDateStr);
  const after = dayjs(afterDateStr);
  if (!last.isValid() || !after.isValid()) return null;

  if (frequency === 'daily') {
    const diff = after.startOf('day').diff(last.startOf('day'), 'day');
    const steps = diff >= 0 ? Math.floor(diff / interval) + 1 : 1;
    return last.add(steps * interval, 'day').format('YYYY-MM-DD');
  }

  if (frequency === 'weekly') {
    const diff = after.startOf('day').diff(last.startOf('day'), 'week');
    const steps = diff >= 0 ? Math.floor(diff / interval) + 1 : 1;
    return last.add(steps * interval, 'week').format('YYYY-MM-DD');
  }

  let next = last.add(interval, unit);
  while (next.isBefore(after, 'day') || next.isSame(after, 'day')) {
    next = next.add(interval, unit);
  }
  return next.format('YYYY-MM-DD');
}

async function ensureRecurringIncomesThrough({ userId, throughDate, Income, now = new Date() }) {
  const through = toISODateOnly(throughDate);
  if (!userId || !through) return { created: 0 };

  const todayStr = dayjs(now).format('YYYY-MM-DD');
  if (dayjs(through).isBefore(todayStr, 'day')) return { created: 0 };

  const recurring = await Income.findAll({
    where: { user_id: userId, is_recurring: true },
    order: [
      ['recurrence_id', 'ASC'],
      ['date', 'DESC'],
      ['id', 'DESC'],
    ],
  });

  const latestBySeries = new Map();
  for (const inc of recurring) {
    const sid = inc.recurrence_id || inc.id;
    if (!latestBySeries.has(sid)) {
      latestBySeries.set(sid, inc);
    }
  }

  let created = 0;
  for (const [seriesId, latest] of latestBySeries.entries()) {
    if (!latest.recurrence_id) {
      try {
        await latest.update({ recurrence_id: latest.id });
      } catch {}
    }

    const frequency = normalizeFrequency(latest.recurrence_frequency) || 'monthly';
    const interval = normalizeInterval(latest.recurrence_interval);
    const untilStr = toISODateOnly(latest.recurrence_until);
    const until = untilStr ? dayjs(untilStr) : null;
    const exceptions = new Set(parseExceptions(latest.recurrence_exceptions));

    const afterForSeries = dayjs(latest.date).isAfter(todayStr, 'day') ? dayjs(latest.date).format('YYYY-MM-DD') : todayStr;
    let nextStr = nextOccurrenceAfter(latest.date, frequency, interval, afterForSeries);

    while (nextStr && (dayjs(nextStr).isBefore(through, 'day') || dayjs(nextStr).isSame(through, 'day'))) {
      if (until && dayjs(nextStr).isAfter(until, 'day')) break;
      if (exceptions.has(nextStr)) {
        nextStr = dayjs(nextStr).add(interval, UNIT_BY_FREQUENCY[frequency]).format('YYYY-MM-DD');
        continue;
      }

      const existing = await Income.findOne({
        where: {
          user_id: userId,
          is_recurring: true,
          recurrence_id: seriesId,
          date: nextStr,
        },
      });

      if (!existing) {
        await Income.create({
          user_id: userId,
          account_id: latest.account_id,
          description: latest.description,
          value: latest.value,
          date: nextStr,
          category: latest.category,
          is_recurring: true,
          recurrence_id: seriesId,
          recurrence_frequency: frequency,
          recurrence_interval: interval,
          recurrence_until: untilStr,
          recurrence_exceptions: latest.recurrence_exceptions,
          posted: false,
        });
        created += 1;
      }

      nextStr = dayjs(nextStr).add(interval, UNIT_BY_FREQUENCY[frequency]).format('YYYY-MM-DD');
    }
  }

  return { created };
}

async function deleteRecurringIncomeOccurrenceOnly({ income, Income, Account }) {
  if (!income || !income.is_recurring) {
    return { deleted: 0, reversedBalance: 0 };
  }

  const seriesWhere = getIncomeSeriesWhere(income);
  const currentExceptions = parseExceptions(income.recurrence_exceptions);
  const nextExceptions = serializeExceptions([...currentExceptions, income.date]);
  const frequency = normalizeFrequency(income.recurrence_frequency) || 'monthly';
  const interval = normalizeInterval(income.recurrence_interval);
  const nextDate = nextOccurrenceAfter(income.date, frequency, interval, income.date);
  const hasOtherOccurrences = await Income.count({
    where: {
      ...seriesWhere,
      id: { [Op.ne]: income.id },
    },
  });

  await Income.update(
    { recurrence_exceptions: nextExceptions, recurrence_id: income.recurrence_id || income.id },
    { where: seriesWhere }
  );

  if (!hasOtherOccurrences && nextDate) {
    const until = income.recurrence_until ? dayjs(income.recurrence_until) : null;
    if (!until || !dayjs(nextDate).isAfter(until, 'day')) {
      await Income.create({
        user_id: income.user_id,
        account_id: income.account_id,
        description: income.description,
        value: income.value,
        date: nextDate,
        category: income.category,
        is_recurring: true,
        recurrence_id: income.recurrence_id || income.id,
        recurrence_frequency: frequency,
        recurrence_interval: interval,
        recurrence_until: income.recurrence_until,
        recurrence_exceptions: nextExceptions,
        posted: false,
      });
    }
  }

  let reversedBalance = 0;
  if (income.account_id && !!income.posted) {
    const account = await Account.findOne({
      where: { id: income.account_id, user_id: income.user_id },
    });
    if (account) {
      account.balance = Number(account.balance) - Number(income.value);
      await account.save();
      reversedBalance = Number(income.value);
    }
  }

  await income.destroy();
  return { deleted: 1, reversedBalance };
}

async function stopRecurringIncomeSeriesFrom({ income, Income, Account }) {
  if (!income || !income.is_recurring) {
    return { deleted: 0, reversedBalance: 0 };
  }

  const seriesId = income.recurrence_id || income.id;
  const seriesWhere = getIncomeSeriesWhere(income);

  const affected = await Income.findAll({
    where: {
      ...seriesWhere,
      date: { [Op.gte]: income.date },
    },
    order: [['date', 'ASC'], ['id', 'ASC']],
  });

  let reversedBalance = 0;
  for (const item of affected) {
    const applied = !!item.posted;
    if (applied && item.account_id) {
      const account = await Account.findOne({
        where: { id: item.account_id, user_id: item.user_id },
      });
      if (account) {
        account.balance = Number(account.balance) - Number(item.value);
        await account.save();
        reversedBalance += Number(item.value);
      }
    }
  }

  if (affected.length) {
    await Income.destroy({
      where: { id: { [Op.in]: affected.map((item) => item.id) } },
    });
  }

  const previous = await Income.findOne({
    where: {
      ...seriesWhere,
      date: { [Op.lt]: income.date },
    },
    order: [['date', 'DESC'], ['id', 'DESC']],
  });

  if (previous) {
    await Income.update(
      { recurrence_until: previous.date, recurrence_id: seriesId },
      { where: seriesWhere }
    );
  }

  return { deleted: affected.length, reversedBalance };
}

async function deleteRecurringIncomeSeries({ income, Income, Account }) {
  if (!income || !income.is_recurring) {
    return { deleted: 0, reversedBalance: 0 };
  }

  const seriesWhere = getIncomeSeriesWhere(income);
  const affected = await Income.findAll({
    where: seriesWhere,
    order: [['date', 'ASC'], ['id', 'ASC']],
  });

  let reversedBalance = 0;
  for (const item of affected) {
    if (item.account_id && !!item.posted) {
      const account = await Account.findOne({
        where: { id: item.account_id, user_id: item.user_id },
      });
      if (account) {
        account.balance = Number(account.balance) - Number(item.value);
        await account.save();
        reversedBalance += Number(item.value);
      }
    }
  }

  if (affected.length) {
    await Income.destroy({ where: { id: { [Op.in]: affected.map((item) => item.id) } } });
  }

  return { deleted: affected.length, reversedBalance };
}

module.exports = {
  deleteRecurringIncomeOccurrenceOnly,
  deleteRecurringIncomeSeries,
  ensureRecurringIncomesThrough,
  nextOccurrenceAfter,
  normalizeFrequency,
  normalizeInterval,
  stopRecurringIncomeSeriesFrom,
  toISODateOnly,
};

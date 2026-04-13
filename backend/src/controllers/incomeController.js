const { Income } = require('../models');
const Account = require('../models/account');
const dayjs = require('dayjs');
const {
  deleteRecurringIncomeOccurrenceOnly,
  deleteRecurringIncomeSeries,
  ensureRecurringIncomesThrough,
  normalizeFrequency,
  normalizeInterval,
  stopRecurringIncomeSeriesFrom,
  toISODateOnly
} = require('../services/recurringIncomes');

// Helper: retorna true se a data (DATEONLY ou Date) for hoje ou passada
function isEffective(dateInput) {
  if (!dateInput) return false;
  let d;
  if (dateInput instanceof Date) {
    d = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  } else if (typeof dateInput === 'string') {
    // dateInput esperado como 'YYYY-MM-DD'
    const [y, m, day] = dateInput.split('-').map(Number);
    d = new Date(y, (m || 1) - 1, day || 1);
  } else {
    d = new Date(dateInput);
    if (!isFinite(d)) return false;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d.getTime() <= today.getTime();
}

exports.list = async (req, res) => {
  const { start, end } = req.query;
  const where = { user_id: req.user.id };
  const { Op } = require('sequelize');
  if (start && end) {
    const endIso = toISODateOnly(end);
    if (endIso) {
      try {
        await ensureRecurringIncomesThrough({ userId: req.user.id, throughDate: endIso, Income });
      } catch {}
    }
    where.date = { [Op.gte]: start, [Op.lte]: end };
  }
  const incomes = await Income.findAll({ where });
  res.json(incomes);
};

exports.create = async (req, res) => {
  try {
    const { account_id, description, value, date, category, is_recurring, recurrence_frequency, recurrence_interval, recurrence_until } = req.body;
    const willBeApplied = isEffective(date);
    const recurring = !!is_recurring;
    const frequency = recurring ? (normalizeFrequency(recurrence_frequency) || 'monthly') : null;
    const interval = recurring ? normalizeInterval(recurrence_interval) : null;
    const until = recurring ? toISODateOnly(recurrence_until) : null;
    const existing = await Income.findOne({
      where: {
        user_id: req.user.id,
        account_id,
        description,
        value,
        date,
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Receita duplicada detectada. Operação cancelada.' });
    }
    const income = await Income.create({
      user_id: req.user.id,
      account_id,
      description,
      value,
      date,
      category,
      is_recurring: recurring,
      recurrence_frequency: frequency,
      recurrence_interval: interval,
      recurrence_until: until,
      recurrence_exceptions: null,
      posted: willBeApplied,
    });
    if (recurring) {
      try {
        await income.update({ recurrence_id: income.id });
        const horizon = dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD');
        await ensureRecurringIncomesThrough({ userId: req.user.id, throughDate: horizon, Income });
      } catch {}
    }
    // Atualiza saldo da conta somente se a data for hoje ou passada (posted=true)
    if (account_id && willBeApplied) {
      const account = await Account.findOne({ where: { id: account_id, user_id: req.user.id } });
      if (account) {
        account.balance = Number(account.balance) + Number(value);
        await account.save();
      }
    }
    res.status(201).json(income);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { description, value, date, category, is_recurring, account_id, recurrence_frequency, recurrence_interval, recurrence_until } = req.body;
    const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!income) return res.status(404).json({ error: 'Receita não encontrada' });

    // Valores originais
    const origAccountId = income.account_id;
    const origValue = Number(income.value);
    const origDate = income.date;
    const origPosted = income.posted;

    // Novos valores (mantém original se não enviado)
    const newAccountId = account_id !== undefined ? account_id : origAccountId;
    const newValue = value !== undefined ? Number(value) : origValue;
    const newDate = date !== undefined ? date : origDate;

    const wasApplied = (origPosted !== undefined) ? !!origPosted : isEffective(origDate);
    const willBeApplied = isEffective(newDate);

    // Ajuste de saldo conforme alterações
    if (origAccountId !== newAccountId) {
      // Conta mudou
      if (wasApplied && origAccountId) {
        const accOld = await Account.findOne({ where: { id: origAccountId, user_id: req.user.id } });
        if (accOld) {
          accOld.balance = Number(accOld.balance) - origValue;
          await accOld.save();
        }
      }
      if (willBeApplied && newAccountId) {
        const accNew = await Account.findOne({ where: { id: newAccountId, user_id: req.user.id } });
        if (accNew) {
          accNew.balance = Number(accNew.balance) + newValue;
          await accNew.save();
        }
      }
    } else {
      // Mesma conta
      if (origAccountId) {
        const acc = await Account.findOne({ where: { id: origAccountId, user_id: req.user.id } });
        if (acc) {
          if (wasApplied && willBeApplied) {
            const delta = newValue - origValue;
            if (delta !== 0) {
              acc.balance = Number(acc.balance) + delta;
              await acc.save();
            }
          } else if (wasApplied && !willBeApplied) {
            // Estava aplicado e deixará de estar
            acc.balance = Number(acc.balance) - origValue;
            await acc.save();
          } else if (!wasApplied && willBeApplied) {
            // Não estava aplicado e passará a estar
            acc.balance = Number(acc.balance) + newValue;
            await acc.save();
          }
        }
      }
    }

    const recurring = is_recurring !== undefined ? !!is_recurring : !!income.is_recurring;
    const frequency = recurring ? (normalizeFrequency(recurrence_frequency !== undefined ? recurrence_frequency : income.recurrence_frequency) || 'monthly') : null;
    const interval = recurring ? normalizeInterval(recurrence_interval !== undefined ? recurrence_interval : income.recurrence_interval) : null;
    const until = recurring ? toISODateOnly(recurrence_until !== undefined ? recurrence_until : income.recurrence_until) : null;

    await income.update({
      description,
      value,
      date,
      category,
      is_recurring: recurring,
      recurrence_frequency: frequency,
      recurrence_interval: interval,
      recurrence_until: until,
      recurrence_exceptions: recurring ? income.recurrence_exceptions : null,
      account_id: newAccountId,
      posted: willBeApplied,
      ...(recurring ? {} : { recurrence_id: null }),
    });

    if (recurring) {
      try {
        if (!income.recurrence_id) {
          await income.update({ recurrence_id: income.id });
        }
        const horizon = dayjs().add(1, 'month').endOf('month').format('YYYY-MM-DD');
        await ensureRecurringIncomesThrough({ userId: req.user.id, throughDate: horizon, Income });
      } catch {}
    }
    res.json(income);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  const income = await Income.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!income) return res.status(404).json({ error: 'Receita não encontrada' });

  if (income.is_recurring) {
    const deleteMode = String(req.query.deleteMode || req.query.mode || 'future').toLowerCase();
    if (deleteMode === 'single') {
      await deleteRecurringIncomeOccurrenceOnly({ income, Income, Account });
    } else if (deleteMode === 'all') {
      await deleteRecurringIncomeSeries({ income, Income, Account });
    } else {
      await stopRecurringIncomeSeriesFrom({ income, Income, Account });
    }
    return res.json({ success: true });
  }

  // Se a receita já estava aplicada (posted=true OU, fallback, data hoje/passada), reverter do saldo
  const applied = (income.posted !== undefined) ? !!income.posted : isEffective(income.date);
  if (income.account_id && applied) {
    const account = await Account.findOne({ where: { id: income.account_id, user_id: req.user.id } });
    if (account) {
      account.balance = Number(account.balance) - Number(income.value);
      await account.save();
    }
  }

  await income.destroy();
  res.json({ success: true });
};

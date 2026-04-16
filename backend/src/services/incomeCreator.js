const dayjs = require('dayjs');

function makeError(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function validateRecurringInput({ is_recurring, recurrence_frequency, recurrence_interval, normalizeFrequency, normalizeInterval }) {
  if (!is_recurring) return;

  if (recurrence_frequency !== undefined && recurrence_frequency !== null && String(recurrence_frequency).trim() !== '') {
    if (!normalizeFrequency(recurrence_frequency)) {
      throw makeError('Frequência de recorrência inválida.', 400);
    }
  }

  if (recurrence_interval !== undefined && recurrence_interval !== null && String(recurrence_interval).trim() !== '') {
    const n = Number(recurrence_interval);
    if (!Number.isFinite(n) || n < 1) {
      throw makeError('Intervalo de recorrência inválido.', 400);
    }
    normalizeInterval(recurrence_interval);
  }
}

async function createIncome({
  userId,
  body,
  Income,
  Account,
  FinancialAuditLog,
  sequelize,
  isEffective,
  normalizeFrequency,
  normalizeInterval,
  toISODateOnly,
  now = new Date(),
}) {
  const {
    account_id,
    description,
    value,
    date,
    category,
    is_recurring,
    recurrence_frequency,
    recurrence_interval,
    recurrence_until,
  } = body;

  if (!account_id) throw makeError('account_id é obrigatório.', 400);
  if (!description) throw makeError('description é obrigatório.', 400);
  if (value === undefined || value === null || value === '') throw makeError('value é obrigatório.', 400);
  if (!date) throw makeError('date é obrigatório.', 400);

  const willBeApplied = isEffective(date);
  const recurring = !!is_recurring;

  validateRecurringInput({
    is_recurring: recurring,
    recurrence_frequency,
    recurrence_interval,
    normalizeFrequency,
    normalizeInterval,
  });

  const frequency = recurring ? (normalizeFrequency(recurrence_frequency) || 'monthly') : null;
  const interval = recurring ? normalizeInterval(recurrence_interval) : null;
  const until = recurring ? toISODateOnly(recurrence_until) : null;

  const income = await sequelize.transaction(async (t) => {
    const existing = await Income.findOne({
      where: { user_id: userId, account_id, description, value, date },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (existing) throw makeError('Receita duplicada detectada. Operação cancelada.', 409);

    const created = await Income.create(
      {
        user_id: userId,
        account_id,
        description,
        value,
        date,
        category,
        is_recurring: false,
        recurrence_id: null,
        recurrence_frequency: null,
        recurrence_interval: null,
        recurrence_until: null,
        recurrence_exceptions: null,
        posted: willBeApplied,
      },
      { transaction: t }
    );

    if (recurring) {
      await created.update(
        {
          is_recurring: true,
          recurrence_id: created.id,
          recurrence_frequency: frequency,
          recurrence_interval: interval,
          recurrence_until: until,
          recurrence_exceptions: null,
        },
        { transaction: t }
      );
    }

    if (willBeApplied) {
      const account = await Account.findOne({
        where: { id: account_id, user_id: userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (account) {
        account.balance = Number(account.balance) + Number(value);
        await account.save({ transaction: t });
      }
    }

    if (FinancialAuditLog) {
      try {
        await FinancialAuditLog.create(
          {
            user_id: userId,
            action: 'income_created',
            entity_type: 'income',
            entity_id: created.id,
            details: JSON.stringify({
              account_id,
              date,
              value: String(value),
              is_recurring: recurring,
              recurrence_frequency: frequency,
              recurrence_interval: interval,
              recurrence_until: until,
              at: dayjs(now).toISOString(),
            }),
          },
          { transaction: t }
        );
      } catch {}
    }

    await created.reload({ transaction: t });
    return created;
  });

  return { income, recurring };
}

module.exports = { createIncome };


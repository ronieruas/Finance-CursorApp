const dayjs = require('dayjs');
const { Op } = require('sequelize');

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
  const unique = [...new Set((values || []).filter(Boolean))].sort();
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
  const currentExceptions = parseExceptions(expense.recurrence_exceptions);
  const nextExceptions = serializeExceptions([...currentExceptions, expense.due_date]);
  const nextDueDateStr = dayjs(expense.due_date).add(1, 'month').format('YYYY-MM-DD');
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
    if ((!until || !dayjs(nextDueDateStr).isAfter(until, 'day')) && !currentExceptions.includes(nextDueDateStr)) {
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
        recurrence_until: expense.recurrence_until,
        recurrence_exceptions: nextExceptions,
        auto_debit: expense.auto_debit,
        installment_number: expense.installment_number,
        installment_total: expense.installment_total,
      });
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

async function generateNextRecurringExpenses({ Expense }) {
  const recurringExpenses = await Expense.findAll({
    where: {
      is_recurring: true,
      status: 'paga',
      account_id: { [Op.ne]: null },
    },
  });

  let created = 0;

  for (const expense of recurringExpenses) {
    const until = expense.recurrence_until ? dayjs(expense.recurrence_until) : null;
    const exceptions = new Set(parseExceptions(expense.recurrence_exceptions));
    let candidate = dayjs(expense.due_date).add(1, 'month');

    while (true) {
      if (until && candidate.isAfter(until, 'day')) {
        break;
      }

      const candidateStr = candidate.format('YYYY-MM-DD');
      if (exceptions.has(candidateStr)) {
        candidate = candidate.add(1, 'month');
        continue;
      }

      const existingExpense = await Expense.findOne({
        where: {
          ...buildSeriesWhere(expense),
          due_date: candidateStr,
        },
      });

      if (existingExpense) {
        break;
      }

      const createdExpense = await Expense.create({
        user_id: expense.user_id,
        account_id: expense.account_id,
        credit_card_id: expense.credit_card_id,
        description: expense.description,
        value: expense.value,
        due_date: candidateStr,
        category: expense.category,
        status: 'pendente',
        is_recurring: true,
        recurrence_id: expense.recurrence_id || expense.id,
        recurrence_until: expense.recurrence_until,
        recurrence_exceptions: expense.recurrence_exceptions,
        auto_debit: expense.auto_debit,
        installment_number: expense.installment_number,
        installment_total: expense.installment_total,
      });
      if (!createdExpense.recurrence_id) {
        await createdExpense.update({ recurrence_id: createdExpense.id });
      }
      created += 1;
      break;
    }
  }

  return { created };
}

module.exports = {
  deleteRecurringExpenseOccurrenceOnly,
  deleteRecurringExpenseSeries,
  generateNextRecurringExpenses,
  stopRecurringExpenseSeriesFrom,
};

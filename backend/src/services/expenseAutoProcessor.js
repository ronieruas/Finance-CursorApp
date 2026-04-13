const { Op } = require('sequelize');

async function processExpensesAutomatic({ Expense, Account, FinancialAuditLog, sequelize, generateNextRecurringExpenses, now = new Date() }) {
  const dialect = sequelize.getDialect();
  let advisoryLocked = false;

  if (dialect === 'postgres') {
    const [rows] = await sequelize.query("SELECT pg_try_advisory_lock(hashtext('process_expenses')) AS locked;");
    advisoryLocked = !!(rows && rows[0] && rows[0].locked);
    if (!advisoryLocked) {
      if (FinancialAuditLog) {
        try {
          await FinancialAuditLog.create({
            action: 'process_expenses_skipped_advisory_lock',
            details: JSON.stringify({ at: new Date().toISOString() }),
          });
        } catch {}
      }
      return { skipped: true, paid: 0, auto_debit_paid: 0, recurring_created: 0 };
    }
  }

  try {
    const pendingExpenses = await Expense.findAll({
      where: {
        status: 'pendente',
        account_id: { [Op.ne]: null },
        [Op.or]: [
          sequelize.where(sequelize.cast(sequelize.col('paid_at'), 'date'), '<=', sequelize.literal('CURRENT_DATE')),
          {
            [Op.and]: [
              { paid_at: { [Op.is]: null } },
              sequelize.where(sequelize.col('due_date'), '<=', sequelize.literal('CURRENT_DATE')),
              { [Op.or]: [{ auto_debit: false }, { auto_debit: { [Op.is]: null } }] },
            ],
          },
        ],
      },
    });

    let paid = 0;
    for (const expense of pendingExpenses) {
      await sequelize.transaction(async (t) => {
        const lockedExpense = await Expense.findOne({
          where: { id: expense.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedExpense || lockedExpense.status !== 'pendente' || !lockedExpense.account_id) return;

        await lockedExpense.update(
          { status: 'paga', paid_at: lockedExpense.paid_at || now },
          { transaction: t }
        );

        const account = await Account.findOne({
          where: { id: lockedExpense.account_id, user_id: lockedExpense.user_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (account) {
          account.balance = Number(account.balance) - Number(lockedExpense.value);
          await account.save({ transaction: t });
        }

        if (FinancialAuditLog) {
          try {
            await FinancialAuditLog.create(
              {
                user_id: lockedExpense.user_id,
                action: 'expense_auto_paid',
                entity_type: 'expense',
                entity_id: lockedExpense.id,
                details: JSON.stringify({
                  account_id: lockedExpense.account_id,
                  value: String(lockedExpense.value),
                  due_date: lockedExpense.due_date,
                }),
              },
              { transaction: t }
            );
          } catch {}
        }
        paid += 1;
      });
    }

    const recurringResult = generateNextRecurringExpenses ? await generateNextRecurringExpenses() : { created: 0 };

    const autoDebitExpenses = await Expense.findAll({
      where: {
        auto_debit: true,
        status: 'pendente',
        account_id: { [Op.ne]: null },
        [Op.and]: [sequelize.where(sequelize.col('due_date'), '<=', sequelize.literal('CURRENT_DATE'))],
      },
    });

    let auto_debit_paid = 0;
    for (const expense of autoDebitExpenses) {
      await sequelize.transaction(async (t) => {
        const lockedExpense = await Expense.findOne({
          where: { id: expense.id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!lockedExpense || lockedExpense.status !== 'pendente' || !lockedExpense.account_id) return;

        const account = await Account.findOne({
          where: { id: lockedExpense.account_id, user_id: lockedExpense.user_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!account || Number(account.balance) < Number(lockedExpense.value)) return;

        account.balance = Number(account.balance) - Number(lockedExpense.value);
        await account.save({ transaction: t });

        await lockedExpense.update({ status: 'paga', paid_at: now }, { transaction: t });

        if (FinancialAuditLog) {
          try {
            await FinancialAuditLog.create(
              {
                user_id: lockedExpense.user_id,
                action: 'expense_auto_debit_paid',
                entity_type: 'expense',
                entity_id: lockedExpense.id,
                details: JSON.stringify({
                  account_id: lockedExpense.account_id,
                  value: String(lockedExpense.value),
                  due_date: lockedExpense.due_date,
                }),
              },
              { transaction: t }
            );
          } catch {}
        }

        auto_debit_paid += 1;
      });
    }

    return {
      skipped: false,
      paid,
      auto_debit_paid,
      recurring_created: recurringResult.created || 0,
    };
  } finally {
    if (dialect === 'postgres') {
      await sequelize.query("SELECT pg_advisory_unlock(hashtext('process_expenses'));").catch(() => {});
    }
  }
}

module.exports = { processExpensesAutomatic };


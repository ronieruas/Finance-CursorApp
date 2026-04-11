const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const dayjs = require('dayjs');
const { Income } = require('../models');
const { ensureRecurringIncomesThrough } = require('../services/recurringIncomes');

async function processIncomes({ now = new Date(), horizonMonths = 1 } = {}) {
  const horizon = dayjs(now).add(horizonMonths, 'month').endOf('month').format('YYYY-MM-DD');

  const users = await Income.findAll({
    where: { is_recurring: true },
    attributes: ['user_id'],
    group: ['user_id'],
  });

  let created = 0;
  for (const u of users) {
    const userId = u.user_id;
    if (!userId) continue;
    const r = await ensureRecurringIncomesThrough({ userId, throughDate: horizon, Income, now });
    created += r.created || 0;
  }

  return { created, horizon };
}

if (require.main === module) {
  processIncomes()
    .then((r) => {
      console.log(`[INCOMES] Recorrentes processadas. created=${r.created} horizon=${r.horizon}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[INCOMES] Erro ao processar receitas recorrentes:', err);
      process.exit(1);
    });
}

module.exports = { processIncomes };


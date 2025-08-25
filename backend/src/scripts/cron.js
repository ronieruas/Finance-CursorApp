const cron = require('node-cron');
const { processExpenses } = require('./processExpenses');
const { Income, Account, sequelize } = require('../models');
const { Op } = require('sequelize');

// Executar a cada 3 horas no minuto 1 (00:01, 03:01, 06:01, ...)
cron.schedule('1 */3 * * *', async () => {
  console.log('Executando processamento automático de despesas (a cada 3 horas)...');
  try {
    await processExpenses();
    console.log('Processamento automático concluído com sucesso!');
  } catch (err) {
    console.error('Erro no processamento automático:', err);
  }
}, {
  scheduled: true,
  timezone: "America/Sao_Paulo"
});

// Job diário: aplicar receitas agendadas (date <= hoje) que ainda não foram postadas (posted=false)
cron.schedule('10 2 * * *', async () => {
  console.log('[CRON] Aplicando receitas agendadas (diariamente às 02:10)...');
  console.log(`[CRON] TZ=${process.env.TZ || 'N/A'} | now=${new Date().toString()}`);
  try {
    // Usar CURRENT_DATE no banco para evitar qualquer drift de timezone
    const incomes = await Income.findAll({
      where: {
        posted: { [Op.or]: [false, null] },
        date: { [Op.lte]: sequelize.literal('CURRENT_DATE') },
      }
    });

    console.log(`[CRON] Encontradas ${incomes.length} receita(s) para aplicar.`);

    for (const inc of incomes) {
      console.log(`[CRON] Aplicando receita id=${inc.id} user=${inc.user_id} conta=${inc.account_id} date=${inc.date} valor=${inc.value}`);
      await sequelize.transaction(async (t) => {
        const account = await Account.findOne({ where: { id: inc.account_id, user_id: inc.user_id }, transaction: t, lock: t.LOCK.UPDATE });
        if (!account) {
          console.warn(`[CRON] Conta ${inc.account_id} não encontrada para a receita ${inc.id}. Pulando.`);
          await inc.update({ posted: true }, { transaction: t }); // evita reprocessar indefinidamente
          return;
        }
        account.balance = Number(account.balance) + Number(inc.value);
        await account.save({ transaction: t });
        await inc.update({ posted: true }, { transaction: t });
      });
    }

    console.log('[CRON] Aplicação de receitas concluída.');
  } catch (err) {
    console.error('[CRON] Erro ao aplicar receitas agendadas:', err);
  }
}, {
  scheduled: true,
  timezone: 'America/Sao_Paulo'
});

console.log('Cron job configurado para executar a cada 3 horas (no minuto 1 de cada janela)');
console.log('Cron job diário configurado para 02:10 (America/Sao_Paulo)');

// Exportar para uso em outros módulos
module.exports = { cron };
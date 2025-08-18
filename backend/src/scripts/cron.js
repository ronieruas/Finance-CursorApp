const cron = require('node-cron');
const { processExpenses } = require('./processExpenses');

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

console.log('Cron job configurado para executar a cada 3 horas (no minuto 1 de cada janela)');

// Exportar para uso em outros módulos
module.exports = { cron };
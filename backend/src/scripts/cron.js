const cron = require('node-cron');
const { processExpenses } = require('./processExpenses');

// Executar todos os dias às 00:01
cron.schedule('1 0 * * *', async () => {
  console.log('Executando processamento automático de despesas...');
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

console.log('Cron job configurado para executar diariamente às 00:01');

// Exportar para uso em outros módulos
module.exports = { cron }; 
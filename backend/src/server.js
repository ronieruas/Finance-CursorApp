require('dotenv').config();

// Importar cron job para processamento automático
require('./scripts/cron');

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
console.log('Loading server module...');

require('dotenv').config();

console.log('Loading dotenv...');

// Importar cron job para processamento automático
require('./scripts/cron');

console.log('Loading cron...');

const app = require('./app');

console.log('App module loaded:', typeof app);

const PORT = process.env.PORT || 3001;

console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

server.on('listening', () => {
  console.log('Server is listening');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Adicionar um log para verificar se o servidor está realmente iniciando
setTimeout(() => {
  console.log('Server timeout check');
}, 5000);

console.log('Server started.');

// Adicionar um log para verificar se o servidor está realmente iniciando
setInterval(() => {
  console.log('Server interval check');
}, 10000);

// Adicionar um log para verificar se o servidor está realmente iniciando
app.get('/server-test', (req, res) => {
  console.log('Server test route accessed');
  res.json({ message: 'Server test route working' });
});
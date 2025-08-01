const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Importar cron job para processamento automático
require('./scripts/cron');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/incomes', require('./routes/incomes'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/creditCards', require('./routes/creditCards'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/resumo', require('./routes/resumo'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/notifications', require('./routes/notifications'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 
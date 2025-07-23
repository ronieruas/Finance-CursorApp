const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS seguro para produção e testes locais
const allowedOrigins = [
  'https://finance.ronieruas.com.br', // Frontend em produção
  'http://192.168.0.223',             // IP local para testes
  'http://localhost:3000'             // Para desenvolvimento local (opcional)
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // Permite requests sem origin (ex: mobile, curl)
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

// Servir o build do React
const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Para qualquer rota que não seja API, retorna o index.html do React
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

module.exports = app;

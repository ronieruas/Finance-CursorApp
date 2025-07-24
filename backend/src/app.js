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

// Permitir preflight para todos os endpoints
app.options('*', cors());

app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

// Removido o trecho que servia o build do React e o fallback para index.html

module.exports = app;

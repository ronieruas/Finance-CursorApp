console.log('Loading app module...');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

console.log('Loading app...');

const app = express();

console.log('App loaded.');

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Original URL:`, req.originalUrl);
  next();
});

console.log('Routes loaded:', routes);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS seguro para produção e testes locais
const allowedOrigins = [
  'https://finance.ronieruas.com.br', // Frontend em produção
  'http://192.168.0.223',             // IP local para testes
  'http://localhost:3000',             // Para desenvolvimento local (opcional)
  'http://localhost',                  // Para acesso via Nginx no Docker
  'http://localhost:80'               // Para acesso via Nginx no Docker na porta 80
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

// Montar as rotas
app.use('/', routes);

// Removido o trecho que servia o build do React e o fallback para index.html

module.exports = app;

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
console.log('JWT_SECRET presente:', Boolean(process.env.JWT_SECRET));
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requisição recebida: ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Log para todas as requisições antes do CORS
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Antes do CORS: ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS seguro para produção e testes locais
const allowedOrigins = [
  'https://finance.ronieruas.com.br', // Frontend em produção (HTTPS)
  'http://finance.ronieruas.com.br',  // Frontend em produção (HTTP via Cloudflare)
  'http://192.168.0.223',             // IP local para testes
  'http://localhost:3000',             // Para desenvolvimento local (opcional)
  'http://localhost:3002',             // Desenvolvimento local na porta 3002
  'http://localhost:3003',             // Desenvolvimento local na porta 3003
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

// Log para todas as requisições após o CORS
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Após o CORS: ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Antes das rotas: ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/', routes);

// Log para requisições que chegam às rotas
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Chegou à rota: ${req.method} ${req.originalUrl}`);
  next();
});

// Removido o trecho que servia o build do React e o fallback para index.html

module.exports = app;

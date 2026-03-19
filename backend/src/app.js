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

const dev = (process.env.NODE_ENV || 'development') !== 'production';
const allowedOrigins = [
  'https://finance.ronieruas.com.br',
  'http://finance.ronieruas.com.br',
  'http://192.168.0.223',
  'http://192.168.0.142:3003',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:8081',
  'http://localhost',
  'http://localhost:80',
  'capacitor://localhost',
  'http://10.0.2.2',
  'http://10.0.2.2:3002',
  'http://10.0.2.2:3000'
];

if (dev) {
  app.use(cors({ origin: true, credentials: true }));
} else {
  app.use(cors({
    origin: function(origin, callback) {
      console.log(`[${new Date().toISOString()}] CORS Origin: ${origin}`);
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        if (origin && origin.startsWith('exp://')) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
}

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

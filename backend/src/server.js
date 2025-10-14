console.log('Loading server module...');

require('dotenv').config();

console.log('Loading dotenv...');

// Inicialização automática do JWT_SECRET se não estiver definido
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function ensureJwtSecret() {
  try {
    if (!process.env.JWT_SECRET) {
      const secretFile = path.join(__dirname, '..', '.jwt_secret');
      let secret = '';
      if (fs.existsSync(secretFile)) {
        try {
          secret = (fs.readFileSync(secretFile, 'utf8') || '').trim();
        } catch (readErr) {
          console.warn('Falha ao ler .jwt_secret:', readErr.message);
        }
      }
      if (!secret) {
        secret = crypto.randomBytes(64).toString('hex');
        try {
          fs.writeFileSync(secretFile, secret, { encoding: 'utf8', mode: 0o600 });
          console.log('JWT_SECRET gerado automaticamente e salvo em backend/.jwt_secret');
        } catch (writeErr) {
          console.warn('Falha ao salvar .jwt_secret, o segredo será efêmero:', writeErr.message);
        }
      } else {
        console.log('JWT_SECRET carregado de backend/.jwt_secret');
      }
      process.env.JWT_SECRET = secret;
    }
  } catch (e) {
    console.warn('Não foi possível garantir JWT_SECRET, gerando segredo efêmero:', e.message);
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
  }
}

ensureJwtSecret();

// Importar cron job para processamento automático
require('./scripts/cron');

console.log('Loading cron...');

const app = require('./app');

console.log('App module loaded:', typeof app);

// Garantir client_encoding UTF-8 após conectar com Sequelize
try {
  const { sequelize, syncDb } = require('./models');
  (async () => {
    try {
      await sequelize.authenticate();
      const dialect = sequelize.getDialect();
      if (dialect === 'sqlite') {
        try {
          await syncDb();
          console.log('SQLite: modelos sincronizados com sucesso via sequelize.sync()');
        } catch (syncErr) {
          console.warn('Falha ao sincronizar modelos no SQLite:', syncErr.message);
        }
      } else if (dialect === 'postgres') {
        await sequelize.query("SET client_encoding TO 'UTF8'");
        console.log('client_encoding definido para UTF8');
      }
    } catch (dbErr) {
      console.warn('Não foi possível definir client_encoding UTF8:', dbErr.message);
    }
  })();
} catch (e) {
  console.warn('Falha ao carregar Sequelize para definir client_encoding:', e.message);
}

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
// Evitar logs excessivos em produção
const ENV = process.env.NODE_ENV || 'development';
if (ENV !== 'development') {
  // Remover interval/timeouts ruidosos em produção
  // (manteremos apenas logs de start e erro)
}
// setTimeout(() => {
//   console.log('Server timeout check');
// }, 5000);

console.log('Server started.');

// Adicionar um log para verificar se o servidor está realmente iniciando
// setInterval(() => {
//   console.log('Server interval check');
// }, 10000);

// Adicionar um log para verificar se o servidor está realmente iniciando
app.get('/server-test', (req, res) => {
  console.log('Server test route accessed');
  res.json({
    message: 'Teste: áéíóú ç Ç ã õ â ê ô ü ñ Æ Ø å Å ¿',
    examples: ['maçã', 'coração', 'São Paulo', 'año', 'über', 'façade'],
  });
});
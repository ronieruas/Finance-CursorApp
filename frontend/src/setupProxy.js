const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para /api via o gateway local (Caddy/Nginx) em localhost:80.
  // Mantemos o prefixo /api para que o gateway faça o strip e encaminhe ao backend.
  const target = process.env.DEV_PROXY_TARGET || 'http://localhost';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      // Desativa proxy de WebSocket para evitar interferência com o /ws do CRA
      ws: false,
      logLevel: 'silent',
    })
  );
};
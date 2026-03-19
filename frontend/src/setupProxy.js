const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy para /api apontando diretamente para o backend na porta 3001
  // Para desenvolvimento local sem gateway
  const target = process.env.DEV_PROXY_TARGET || 'http://localhost:3001';
  app.use(
    '/api',
    createProxyMiddleware({
      target,
      changeOrigin: true,
      // Desativa proxy de WebSocket para evitar interferência com o /ws do CRA
      ws: false,
      logLevel: 'silent',
      pathRewrite: {
        '^/api': '', // Remove o prefixo /api ao redirecionar para o backend
      },
    })
  );
};
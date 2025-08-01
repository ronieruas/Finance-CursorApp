#!/bin/bash

echo "=== Diagnóstico do Sistema ==="
echo ""

echo "1. Status dos Containers:"
docker-compose ps
echo ""

echo "2. Logs do Banco de Dados:"
docker-compose logs db --tail=20
echo ""

echo "3. Logs do Backend:"
docker-compose logs backend --tail=20
echo ""

echo "4. Verificar se o banco está respondendo:"
docker exec finance-db pg_isready -U finance -d finance
echo ""

echo "5. Testar conexão do backend com o banco:"
docker exec finance-backend node -e "
const { Sequelize } = require('sequelize');
const config = {
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'finance',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'finance123',
  database: process.env.DB_NAME || 'finance',
  dialect: 'postgres',
  logging: false
};
console.log('Configuração:', config);
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false
});
sequelize.authenticate()
  .then(() => console.log('✅ Conexão OK'))
  .catch(err => console.log('❌ Erro:', err.message))
  .finally(() => sequelize.close());
"
echo ""

echo "6. Variáveis de ambiente do backend:"
docker exec finance-backend env | grep DB_
echo ""

echo "=== Diagnóstico Concluído ===" 
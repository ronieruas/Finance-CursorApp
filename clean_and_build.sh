#!/bin/bash

echo "=== Limpeza e Build Otimizado ==="
echo ""

echo "1. Parando todos os containers..."
docker-compose down
echo ""

echo "2. Removendo containers não utilizados..."
docker container prune -f
echo ""

echo "3. Removendo imagens não utilizadas..."
docker image prune -f
echo ""

echo "4. Removendo volumes não utilizados..."
docker volume prune -f
echo ""

echo "5. Removendo redes não utilizadas..."
docker network prune -f
echo ""

echo "6. Limpeza completa do sistema Docker..."
docker system prune -af
echo ""

echo "7. Verificando espaço disponível..."
df -h
echo ""

echo "8. Limpando cache do npm..."
rm -rf ~/.npm/_cache
echo ""

echo "9. Reconstruindo imagens com otimizações..."
docker-compose build --no-cache --compress
echo ""

echo "10. Iniciando containers em ordem..."
echo "Iniciando banco de dados..."
docker-compose up -d db
sleep 15

echo "Verificando se banco está pronto..."
docker exec finance-db pg_isready -U finance -d finance
echo ""

echo "Iniciando backend..."
docker-compose up -d backend
sleep 20

echo "Iniciando frontend..."
docker-compose up -d frontend
echo ""

echo "11. Verificando status final..."
docker-compose ps
echo ""

echo "12. Logs do backend (últimas 30 linhas):"
docker-compose logs backend --tail=30
echo ""

echo "=== Build Concluído ===" 
#!/bin/bash

echo "=== Reiniciando Sistema ==="
echo ""

echo "1. Parando todos os containers..."
docker-compose down
echo ""

echo "2. Removendo containers antigos..."
docker-compose rm -f
echo ""

echo "3. Reconstruindo imagens..."
docker-compose build --no-cache
echo ""

echo "4. Iniciando banco de dados primeiro..."
docker-compose up -d db
echo ""

echo "5. Aguardando banco de dados inicializar..."
sleep 10
echo ""

echo "6. Verificando se banco está pronto..."
docker exec finance-db pg_isready -U finance -d finance
echo ""

echo "7. Iniciando backend..."
docker-compose up -d backend
echo ""

echo "8. Aguardando backend inicializar..."
sleep 15
echo ""

echo "9. Iniciando frontend..."
docker-compose up -d frontend
echo ""

echo "10. Verificando status final..."
docker-compose ps
echo ""

echo "11. Logs do backend (últimas 20 linhas):"
docker-compose logs backend --tail=20
echo ""

echo "=== Reinicialização Concluída ===" 
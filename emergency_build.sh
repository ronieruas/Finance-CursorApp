#!/bin/bash

echo "=== Build de Emergência (Espaço Limitado) ==="
echo ""

echo "1. Parando tudo..."
docker-compose down
echo ""

echo "2. Limpeza agressiva..."
docker system prune -af --volumes
echo ""

echo "3. Verificando espaço..."
df -h
echo ""

echo "4. Removendo imagens antigas..."
docker images | grep -E "(finance|node|nginx|postgres)" | awk '{print $3}' | xargs -r docker rmi -f
echo ""

echo "5. Build sem cache e com compressão..."
DOCKER_BUILDKIT=1 docker-compose build --no-cache --compress --parallel
echo ""

echo "6. Iniciando apenas o essencial..."
docker-compose up -d db
sleep 20

echo "7. Verificando banco..."
docker exec finance-db pg_isready -U finance -d finance
echo ""

echo "8. Iniciando backend..."
docker-compose up -d backend
sleep 30

echo "9. Iniciando frontend..."
docker-compose up -d frontend
echo ""

echo "10. Status final..."
docker-compose ps
echo ""

echo "=== Build de Emergência Concluído ===" 
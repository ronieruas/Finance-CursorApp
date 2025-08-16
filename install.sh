#!/bin/bash

echo "🚀 Finance App - Instalação Automática para LXC/Produção"
echo "========================================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    echo "   Para Ubuntu/Debian: https://docs.docker.com/engine/install/ubuntu/"
    exit 1
fi

# Verificar Docker Compose (v2 built-in ou plugin)
if ! docker compose version &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose não está instalado. Instale o Docker Compose v2."
        echo "   Docker Compose v2 vem integrado com Docker Engine 20.10+"
        exit 1
    else
        echo "⚠️  Usando docker-compose v1. Recomenda-se Docker Compose v2."
        COMPOSE_CMD="docker-compose"
    fi
else
    COMPOSE_CMD="docker compose"
fi

echo "✅ Docker e Docker Compose encontrados ($COMPOSE_CMD)"

# Verificar espaço em disco
DISK_SPACE=$(df . | awk 'NR==2 {print $4}')
DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))

if [ $DISK_SPACE_GB -lt 2 ]; then
    echo "⚠️  Aviso: Menos de 2GB de espaço livre. Recomenda-se pelo menos 2GB."
    read -p "Continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Espaço em disco verificado"

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
$COMPOSE_CMD down 2>/dev/null

# Limpeza básica
echo "🧹 Limpeza básica do Docker..."
docker system prune -f

# Build das imagens
echo "🔨 Build das imagens Docker..."
$COMPOSE_CMD build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
$COMPOSE_CMD up -d --build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar serviços. Verifique os logs acima."
    exit 1
fi

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 12

# Healthcheck simples
echo "🧪 Validando endpoints..."
if command -v curl &> /dev/null; then
  HTTP_ROOT=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
  HTTP_API=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/ || echo "000")
  echo "ℹ️  / -> $HTTP_ROOT | /api -> $HTTP_API"
  if [ "$HTTP_ROOT" != "200" ] || [ "$HTTP_API" != "200" ]; then
    echo "⚠️  Um ou mais endpoints não retornaram 200. Verifique logs: $COMPOSE_CMD logs --tail=100"
  fi
else
  echo "ℹ️  curl não encontrado, pulando healthcheck"
fi

# Garantir frontend/.env correto
if [ -f "frontend/.env" ]; then
  if ! grep -q '^REACT_APP_API_URL=/api' frontend/.env; then
    echo "⚠️  Ajustando frontend/.env para REACT_APP_API_URL=/api"
    echo "REACT_APP_API_URL=/api" > frontend/.env
    echo "🔁 Rebuild do frontend para aplicar .env"
    $COMPOSE_CMD build --no-cache frontend && $COMPOSE_CMD up -d --no-deps frontend
  fi
else
  echo "ℹ️  Criando frontend/.env com REACT_APP_API_URL=/api"
  echo "REACT_APP_API_URL=/api" > frontend/.env
  $COMPOSE_CMD build --no-cache frontend && $COMPOSE_CMD up -d --no-deps frontend
fi

# Mensagens úteis para LXC/Cloudflare
echo ""
echo "📌 Dicas para LXC/Cloudflare:"
echo "   - Certifique-se de que a porta 80 do host está liberada (iptables/firewall)"
echo "   - No Cloudflare, use DNS proxied e SSL/TLS Full ou Full (strict)"
echo "   - Se usar Flexible, o host pode ficar sem TLS (apenas para teste)"

# Verificar status
echo "🔍 Verificando status dos serviços..."
$COMPOSE_CMD ps

# Verificar logs do backend
echo "📋 Verificando logs do backend..."
$COMPOSE_CMD logs backend | tail -20

echo ""
echo "🎉 Instalação concluída!"
echo ""
echo "📱 Acesse a aplicação em: http://localhost/"
echo "🔧 API via proxy: http://localhost/api/"
echo ""
echo "👤 Credenciais padrão:"
echo "   Email: admin@finance.com"
echo "   Senha: admin123"
echo ""
echo "📚 Comandos úteis:"
echo "   - Ver logs: $COMPOSE_CMD logs -f"
echo "   - Parar: $COMPOSE_CMD down"
echo "   - Reiniciar: $COMPOSE_CMD restart"
echo ""
echo "🔍 Se houver problemas, verifique:"
echo "   - $COMPOSE_CMD logs"
echo "   - $COMPOSE_CMD ps"
echo "   - Espaço em disco: df -h"
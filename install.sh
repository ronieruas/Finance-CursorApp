#!/bin/bash

echo "🚀 Finance App - Instalação Automática"
echo "======================================"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Instale o Docker Compose primeiro."
    exit 1
fi

echo "✅ Docker e Docker Compose encontrados"

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
docker-compose down 2>/dev/null

# Limpeza básica
echo "🧹 Limpeza básica do Docker..."
docker system prune -f

# Build das imagens
echo "🔨 Build das imagens Docker..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Erro no build. Verifique os logs acima."
    exit 1
fi

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar serviços. Verifique os logs acima."
    exit 1
fi

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status
echo "🔍 Verificando status dos serviços..."
docker-compose ps

# Verificar logs do backend
echo "📋 Verificando logs do backend..."
docker-compose logs backend | tail -20

echo ""
echo "🎉 Instalação concluída!"
echo ""
echo "📱 Acesse a aplicação em: http://localhost:3000"
echo "🔧 API Backend em: http://localhost:3001"
echo ""
echo "👤 Credenciais padrão:"
echo "   Email: admin@finance.com"
echo "   Senha: admin123"
echo ""
echo "📚 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Parar: docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo ""
echo "🔍 Se houver problemas, verifique:"
echo "   - docker-compose logs"
echo "   - docker-compose ps"
echo "   - Espaço em disco: df -h" 
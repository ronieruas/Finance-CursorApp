#!/bin/bash
# Script de deploy automatizado para o Finance App
# Uso:
#   ./deploy.sh https://SEU_DOMINIO [--seed] [--clean-cache] [--docker]
#   ./deploy.sh --interactive

set -e

show_help() {
  echo "\nUso: $0 https://SEU_DOMINIO [--seed] [--clean-cache] [--docker]"
  echo "     $0 --interactive"
  echo "\nOpções:"
  echo "  --seed         Roda o seed do admin após o deploy"
  echo "  --clean-cache  Mostra instrução para limpar cache do navegador"
  echo "  --docker       Faz deploy usando Docker Compose"
  echo "  --interactive  Modo interativo (pergunta o que deseja fazer)"
  exit 1
}

# Defaults
SEED=false
CLEAN_CACHE=false
DOCKER=false
INTERACTIVE=false

# Parse args
POSITIONAL=()
for arg in "$@"; do
  case $arg in
    --seed) SEED=true ; shift ;;
    --clean-cache) CLEAN_CACHE=true ; shift ;;
    --docker) DOCKER=true ; shift ;;
    --interactive) INTERACTIVE=true ; shift ;;
    -h|--help) show_help ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done
set -- "${POSITIONAL[@]}"

if [ "$INTERACTIVE" = true ]; then
  echo "==== Modo Interativo de Deploy ===="
  read -p "Digite o domínio (ex: https://finance.ronieruas.com.br): " DOMINIO
  read -p "Rodar seed do admin após deploy? (s/N): " SEED_ANS
  [ "$SEED_ANS" = "s" ] && SEED=true
  read -p "Mostrar instrução para limpar cache do navegador? (s/N): " CACHE_ANS
  [ "$CACHE_ANS" = "s" ] && CLEAN_CACHE=true
  read -p "Usar Docker Compose? (s/N): " DOCKER_ANS
  [ "$DOCKER_ANS" = "s" ] && DOCKER=true
else
  DOMINIO="$1"
fi

if [ -z "$DOMINIO" ]; then
  show_help
fi

if [ "$DOCKER" = true ]; then
  echo "[Docker] Buildando e subindo containers..."
  docker-compose pull
  docker-compose build
  docker-compose up -d
  if [ "$SEED" = true ]; then
    echo "[Docker] Rodando seed do admin..."
    docker-compose exec backend node src/scripts/seedAdmin.js
  fi
  echo "[Docker] Status dos containers:"
  docker-compose ps
else
  # 1. Atualiza o repositório
  echo "[1/6] Atualizando repositório..."
  git pull

  # 2. Build do frontend
  cd frontend
  echo "[2/6] Instalando dependências do frontend..."
  npm install

  echo "[3/6] Buildando frontend com REACT_APP_API_URL=$DOMINIO ..."
  rm -rf build
  REACT_APP_API_URL=$DOMINIO npm run build
  cd ..

  # 3. Instala dependências do backend
  echo "[4/6] Instalando dependências do backend..."
  cd backend
  npm install

  # 4. Reinicia backend com PM2
  echo "[5/6] Reiniciando backend com PM2..."
  pm2 start src/server.js --name finance-backend || pm2 restart finance-backend --update-env

  # 5. Rodar seed do admin se solicitado
  if [ "$SEED" = true ]; then
    echo "[6/6] Rodando seed do admin..."
    node src/scripts/seedAdmin.js
  fi

  # 6. Mostra status final
  echo "\n---\nStatus do PM2:"
  pm2 status
fi

if [ "$CLEAN_CACHE" = true ]; then
  echo "\n[INFO] Para garantir que o frontend novo será carregado, limpe o cache do navegador:"
  echo "  - No Chrome/Edge: Ctrl+Shift+R ou Ctrl+F5"
  echo "  - No Firefox: Ctrl+F5"
  echo "  - No celular: Feche e reabra o navegador, ou limpe dados do site."
fi

echo "\nDeploy concluído! Acesse: $DOMINIO" 
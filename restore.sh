#!/bin/bash

# Script de restauração para o projeto Finance
# Descrição: Restaura um backup específico do sistema Finance

# Configurações
BACKUP_DIR="/mnt/miniserver/Finance/finance"
LOG_FILE="$BACKUP_DIR/restore_logs.log"
DB_NAME="finance"
DB_USER="postgres"
DB_HOST="localhost"
TEMP_DIR="/tmp/finance_restore_temp"

# Função para registrar logs
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Função para listar backups disponíveis
list_backups() {
    echo "Backups disponíveis:"
    ls -lt "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk '{print NR".", $9, "- Criado em:", $6, $7, $8}'
    echo ""
}

# Verificar se o diretório de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Erro: Diretório de backup não encontrado: $BACKUP_DIR"
    exit 1
fi

# Verificar se existem backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -eq 0 ]; then
    echo "Erro: Nenhum backup encontrado em $BACKUP_DIR"
    exit 1
fi

# Mostrar backups disponíveis
list_backups

# Solicitar qual backup restaurar
echo "Digite o número do backup que deseja restaurar ou 'q' para sair:"
read BACKUP_NUMBER

if [ "$BACKUP_NUMBER" = "q" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
fi

# Validar entrada
if ! [[ "$BACKUP_NUMBER" =~ ^[0-9]+$ ]]; then
    echo "Erro: Por favor, digite um número válido."
    exit 1
fi

# Obter o caminho do arquivo de backup selecionado
SELECTED_BACKUP=$(ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | sed -n "${BACKUP_NUMBER}p")

if [ -z "$SELECTED_BACKUP" ]; then
    echo "Erro: Backup número $BACKUP_NUMBER não encontrado."
    exit 1
fi

echo "Backup selecionado: $SELECTED_BACKUP"
echo "AVISO: Esta operação irá substituir os dados atuais. Todos os dados não salvos serão perdidos."
echo "Deseja continuar? (s/n)"
read CONFIRM

if [ "$CONFIRM" != "s" ]; then
    echo "Operação cancelada pelo usuário."
    exit 0
fi

# Iniciar processo de restauração
log "Iniciando restauração do backup: $SELECTED_BACKUP"

# Criar diretório temporário
mkdir -p "$TEMP_DIR"
log "Diretório temporário criado: $TEMP_DIR"

# Extrair arquivos do backup
log "Extraindo arquivos do backup..."
tar -xzf "$SELECTED_BACKUP" -C "$TEMP_DIR"
if [ $? -ne 0 ]; then
    log "ERRO: Falha ao extrair arquivos do backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi
log "Arquivos extraídos com sucesso"

# Verificar se o dump do banco de dados existe
if [ ! -f "$TEMP_DIR/database.dump" ]; then
    log "ERRO: Arquivo de dump do banco de dados não encontrado no backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restaurar banco de dados
log "Restaurando banco de dados..."
echo "Restaurando banco de dados. Isso pode levar alguns minutos..."

# Verificar se o banco de dados existe
EXISTING_DB=$(psql -h "$DB_HOST" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -w "$DB_NAME")
if [ -n "$EXISTING_DB" ]; then
    # Desconectar todos os usuários e dropar o banco de dados
    psql -h "$DB_HOST" -U "$DB_USER" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
    psql -h "$DB_HOST" -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
    log "Banco de dados existente removido"
fi

# Criar novo banco de dados
psql -h "$DB_HOST" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
if [ $? -ne 0 ]; then
    log "ERRO: Falha ao criar novo banco de dados"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Restaurar o dump
pg_restore -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" --encoding=UTF8 "$TEMP_DIR/database.dump"
if [ $? -ne 0 ]; then
    log "AVISO: Restauração do banco de dados concluída com avisos"
else
    log "Restauração do banco de dados concluída com sucesso"
fi

# Restaurar arquivos de configuração
log "Restaurando arquivos de configuração..."

# Restaurar arquivos .env
if [ -f "$TEMP_DIR/backend/.env" ]; then
    cp "$TEMP_DIR/backend/.env" "./backend/.env"
    log "Arquivo restaurado: backend/.env"
fi

if [ -f "$TEMP_DIR/frontend/.env" ]; then
    cp "$TEMP_DIR/frontend/.env" "./frontend/.env"
    log "Arquivo restaurado: frontend/.env"
fi

# Restaurar docker-compose.yml se existir no backup
if [ -f "$TEMP_DIR/docker-compose.yml" ]; then
    cp "$TEMP_DIR/docker-compose.yml" "./docker-compose.yml"
    log "Arquivo restaurado: docker-compose.yml"
fi

# Limpar diretório temporário
rm -rf "$TEMP_DIR"
log "Diretório temporário removido"

log "Restauração concluída com sucesso!"
echo "Restauração concluída com sucesso!"
echo "Para reiniciar os serviços, execute: docker-compose down && docker-compose up -d"

exit 0
#!/bin/bash

# Script de backup automático para o projeto Finance
# Criado em: $(date +"%Y-%m-%d")
# Descrição: Realiza backup diário do banco de dados e arquivos de configuração,
#            mantém apenas os 7 backups mais recentes e verifica integridade.

# Configurações
BACKUP_DIR="/mnt/miniserver/Finance/finance"
LOG_FILE="$BACKUP_DIR/backup_logs.log"
MAX_BACKUPS=7
DB_NAME="finance"
DB_USER="finance"
DB_HOST="finance-db"
ENV_FILES="./backend/.env ./frontend/.env"
DATE_FORMAT=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="finance_backup_$DATE_FORMAT"

# Função para registrar logs
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" >> "$LOG_FILE"
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# Criar diretório de backup se não existir
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    log "Diretório de backup criado: $BACKUP_DIR"
fi

# Iniciar processo de backup
log "Iniciando backup: $BACKUP_NAME"

# Criar diretório temporário para o backup atual
TEMP_DIR="$BACKUP_DIR/temp_$DATE_FORMAT"
mkdir -p "$TEMP_DIR"

# Backup do banco de dados
log "Realizando backup do banco de dados..."
# Usando Docker para executar pg_dump
docker exec finance-db pg_dump -U "$DB_USER" -d "$DB_NAME" -F c --encoding=UTF8 > "$TEMP_DIR/database.dump"
if [ $? -ne 0 ]; then
    log "ERRO: Falha ao realizar backup do banco de dados"
    rm -rf "$TEMP_DIR"
    exit 1
fi
log "Backup do banco de dados concluído com sucesso"

# Backup dos arquivos de configuração
log "Realizando backup dos arquivos de configuração..."
for env_file in $ENV_FILES; do
    if [ -f "$env_file" ]; then
        cp "$env_file" "$TEMP_DIR/$(basename $env_file)"
        log "Arquivo copiado: $env_file"
    else
        log "AVISO: Arquivo não encontrado: $env_file"
    fi
done

# Backup do docker-compose.yml
if [ -f "docker-compose.yml" ]; then
    cp "docker-compose.yml" "$TEMP_DIR/"
    log "Arquivo copiado: docker-compose.yml"
else
    log "AVISO: Arquivo docker-compose.yml não encontrado"
fi

# Compactar todos os arquivos
log "Compactando arquivos de backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$TEMP_DIR" .
if [ $? -ne 0 ]; then
    log "ERRO: Falha ao compactar arquivos de backup"
    rm -rf "$TEMP_DIR"
    exit 1
fi
log "Arquivos compactados com sucesso: $BACKUP_NAME.tar.gz"

# Verificar integridade do arquivo de backup
log "Verificando integridade do backup..."
tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    log "ERRO: Verificação de integridade falhou para $BACKUP_NAME.tar.gz"
    rm -rf "$TEMP_DIR"
    exit 1
fi
log "Verificação de integridade concluída com sucesso"

# Limpar diretório temporário
rm -rf "$TEMP_DIR"

# Rotação de backups (manter apenas os MAX_BACKUPS mais recentes)
log "Realizando rotação de backups (mantendo os $MAX_BACKUPS mais recentes)..."
ls -t "$BACKUP_DIR"/*.tar.gz 2>/dev/null | awk "NR>$MAX_BACKUPS" | xargs -r rm
log "Rotação de backups concluída"

# Contagem final de backups
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
log "Total de backups disponíveis: $BACKUP_COUNT"
log "Backup concluído com sucesso: $BACKUP_NAME"

# Exibir informações sobre espaço em disco
df -h "$BACKUP_DIR" | log

exit 0
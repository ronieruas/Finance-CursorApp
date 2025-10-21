#!/bin/bash

# Script de validação de backup
# Testa se o backup pode ser restaurado com sucesso

set -e

BACKUP_DIR="/backup"
TEST_DB_NAME="finance_test_restore"
POSTGRES_USER="${POSTGRES_USER:-finance}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-finance123}"
LOG_FILE="/var/log/backup-validation.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
    log "Limpando ambiente de teste..."
    docker exec finance-db psql -U "$POSTGRES_USER" -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null || true
}

validate_latest_backup() {
    log "Iniciando validação do backup mais recente..."
    
    # Encontrar o backup mais recente
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/finance_backup_*.sql 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log "ERRO: Nenhum backup encontrado em $BACKUP_DIR"
        exit 1
    fi
    
    log "Backup encontrado: $LATEST_BACKUP"
    
    # Verificar se o arquivo não está vazio
    if [ ! -s "$LATEST_BACKUP" ]; then
        log "ERRO: Arquivo de backup está vazio"
        exit 1
    fi
    
    # Verificar se o arquivo contém SQL válido
    if ! grep -q "PostgreSQL database dump" "$LATEST_BACKUP"; then
        log "ERRO: Arquivo não parece ser um dump válido do PostgreSQL"
        exit 1
    fi
    
    log "Arquivo de backup parece válido"
    
    # Criar database de teste
    log "Criando database de teste: $TEST_DB_NAME"
    docker exec finance-db psql -U "$POSTGRES_USER" -c "CREATE DATABASE $TEST_DB_NAME;" || {
        log "ERRO: Falha ao criar database de teste"
        exit 1
    }
    
    # Restaurar backup no database de teste
    log "Restaurando backup no database de teste..."
    docker exec -i finance-db psql -U "$POSTGRES_USER" -d "$TEST_DB_NAME" < "$LATEST_BACKUP" || {
        log "ERRO: Falha ao restaurar backup"
        cleanup
        exit 1
    }
    
    # Verificar se as tabelas principais existem
    log "Verificando integridade das tabelas..."
    TABLES=("users" "accounts" "transactions" "categories")
    
    for table in "${TABLES[@]}"; do
        COUNT=$(docker exec finance-db psql -U "$POSTGRES_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='$table';" | tr -d ' ')
        if [ "$COUNT" != "1" ]; then
            log "ERRO: Tabela $table não encontrada no backup restaurado"
            cleanup
            exit 1
        fi
        log "✓ Tabela $table encontrada"
    done
    
    # Verificar se há dados nas tabelas (pelo menos users deve ter dados)
    USER_COUNT=$(docker exec finance-db psql -U "$POSTGRES_USER" -d "$TEST_DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    if [ "$USER_COUNT" -eq 0 ]; then
        log "AVISO: Tabela users está vazia - pode indicar problema no backup"
    else
        log "✓ Encontrados $USER_COUNT usuários no backup"
    fi
    
    # Verificar integridade referencial básica
    log "Verificando integridade referencial..."
    docker exec finance-db psql -U "$POSTGRES_USER" -d "$TEST_DB_NAME" -c "
        SELECT 
            t.id, t.account_id, a.id as account_exists
        FROM transactions t 
        LEFT JOIN accounts a ON t.account_id = a.id 
        WHERE a.id IS NULL 
        LIMIT 1;
    " | grep -q "0 rows" && log "✓ Integridade referencial OK" || log "AVISO: Possíveis problemas de integridade referencial"
    
    cleanup
    log "✅ Validação de backup concluída com sucesso!"
    
    # Registrar estatísticas do backup
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    BACKUP_DATE=$(stat -c %y "$LATEST_BACKUP" | cut -d' ' -f1,2)
    log "Estatísticas: Tamanho: $BACKUP_SIZE, Data: $BACKUP_DATE"
}

# Função para validar todos os backups dos últimos N dias
validate_recent_backups() {
    local days=${1:-7}
    log "Validando backups dos últimos $days dias..."
    
    find "$BACKUP_DIR" -name "finance_backup_*.sql" -mtime -"$days" | while read -r backup_file; do
        log "Validando $backup_file..."
        if [ -s "$backup_file" ] && grep -q "PostgreSQL database dump" "$backup_file"; then
            log "✓ $backup_file - OK"
        else
            log "❌ $backup_file - PROBLEMA"
        fi
    done
}

# Função principal
main() {
    case "${1:-latest}" in
        "latest")
            validate_latest_backup
            ;;
        "recent")
            validate_recent_backups "${2:-7}"
            ;;
        "all")
            validate_recent_backups 30
            ;;
        *)
            echo "Uso: $0 [latest|recent [dias]|all]"
            echo "  latest: valida apenas o backup mais recente (padrão)"
            echo "  recent: valida backups dos últimos N dias (padrão: 7)"
            echo "  all: valida backups dos últimos 30 dias"
            exit 1
            ;;
    esac
}

# Trap para cleanup em caso de interrupção
trap cleanup EXIT INT TERM

main "$@"
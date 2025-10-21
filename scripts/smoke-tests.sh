#!/bin/bash

# Smoke Tests para Finance App
# Valida funcionalidades críticas da aplicação

set -e

# Configurações
BASE_URL="http://localhost"
BACKEND_URL="http://localhost/api"
LOG_FILE="./smoke-tests.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Função para teste com retry
test_endpoint() {
    local url=$1
    local expected_code=${2:-200}
    local max_retries=${3:-3}
    local retry_delay=${4:-2}
    
    for i in $(seq 1 $max_retries); do
        if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
            if [ "$response" = "$expected_code" ]; then
                return 0
            fi
        fi
        
        if [ $i -lt $max_retries ]; then
            sleep $retry_delay
        fi
    done
    
    return 1
}

# Função para fazer requisições HTTP
http_request() {
    local method="$1"
    local url="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$url" \
                 -H "Content-Type: application/json" \
                 -H "$headers" \
                 -d "$data"
        else
            curl -s -X "$method" "$url" \
                 -H "Content-Type: application/json" \
                 -d "$data"
        fi
    else
        if [ -n "$headers" ]; then
            curl -s -X "$method" "$url" \
                 -H "$headers"
        else
            curl -s -X "$method" "$url"
        fi
    fi
}

# Teste de conectividade básica
test_connectivity() {
    log "🔍 Testando conectividade básica..."
    
    # Teste do frontend
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
    if [ "$response" = "200" ]; then
        log "✅ Frontend acessível"
    else
        log "❌ Frontend inacessível (HTTP $response)"
        return 1
    fi
    
    # Teste do backend health check
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
    if [ "$response" = "200" ]; then
        log "✅ Backend health check OK"
    else
        log "❌ Backend health check falhou (HTTP $response)"
        return 1
    fi
}

# Teste de autenticação
test_authentication() {
    log "🔐 Testando autenticação..."
    
    # Tentar login com credenciais inválidas
    local response=$(http_request "POST" "$BACKEND_URL/auth/login" '{"email":"invalid@test.com","password":"wrong"}')
    
    if echo "$response" | grep -q "Credenciais inválidas"; then
        log "✅ Rejeição de credenciais inválidas OK"
    else
        log "❌ Falha na rejeição de credenciais inválidas (resposta: $response)"
        return 1
    fi
    
    # Tentar acessar rota protegida sem token
    response=$(http_request "GET" "$BACKEND_URL/accounts")
    
    if echo "$response" | grep -q "Token não fornecido"; then
        log "✅ Proteção de rotas sem token OK"
    else
        log "❌ Falha na proteção de rotas sem token (resposta: $response)"
        return 1
    fi
}

# Teste de operações CRUD básicas
test_crud_operations() {
    log "📊 Testando operações CRUD..."
    
    # Primeiro, fazer login para obter token
    local login_response=$(http_request "POST" "$BACKEND_URL/auth/login" '{"email":"user@example.com","password":"password123"}')
    local token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d: -f2 | tr -d '"')
    
    if [ "$token" = "null" ] || [ -z "$token" ]; then
        log "⚠️  Não foi possível fazer login - pulando testes CRUD"
        return 0
    fi
    
    local auth_header="Authorization: Bearer $token"
    
    # Testar listagem de contas
    local accounts_response=$(http_request "GET" "$BACKEND_URL/accounts" "" "$auth_header")
    
    # Verificar se a resposta contém um array (indicando sucesso)
    if echo "$accounts_response" | grep -q '\['; then
        log "✅ Listagem de contas OK"
    else
        log "❌ Falha na listagem de contas (resposta: $accounts_response)"
        return 1
    fi
    
    # Testar listagem de despesas
    local expenses_response=$(http_request "GET" "$BACKEND_URL/expenses" "" "$auth_header")
    
    if echo "$expenses_response" | grep -q '\['; then
        log "✅ Listagem de despesas OK"
    else
        log "❌ Falha na listagem de despesas (resposta: $expenses_response)"
        return 1
    fi
}

# Teste de integridade do banco de dados
test_database_integrity() {
    log "🗄️  Testando integridade do banco de dados..."
    
    # Verificar se as tabelas principais existem
    local tables=("users" "accounts" "expenses" "incomes")
    
    for table in "${tables[@]}"; do
        local raw_output=$(docker exec finance-db psql -U finance -d finance -t -c "SELECT COUNT(*) FROM $table;" 2>&1)
        local count=$(echo "$raw_output" | xargs)
        
        if [[ "$raw_output" == *"does not exist"* ]] || [[ "$raw_output" == *"ERROR"* ]]; then
            log "❌ Tabela $table não encontrada"
            return 1
        elif [ -z "$count" ] || [ "$count" = "" ]; then
            log "❌ Tabela $table não encontrada (count vazio)"
            return 1
        else
            log "✅ Tabela $table existe (registros: $count)"
        fi
    done
    
    # Verificar integridade referencial básica
    local raw_output=$(docker exec finance-db psql -U finance -d finance -t -c "SELECT COUNT(*) FROM expenses e LEFT JOIN accounts a ON e.account_id = a.id WHERE a.id IS NULL;" 2>/dev/null)
    local orphaned_expenses=$(echo "$raw_output" | xargs)
    
    if [ "$orphaned_expenses" = "0" ]; then
        log "✅ Integridade referencial OK"
    else
        log "⚠️  Encontradas $orphaned_expenses despesas órfãs"
    fi
}

# Teste de performance básica
test_performance() {
    log "⚡ Testando performance básica..."
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL")
    local end_time=$(date +%s%N)
    
    local response_time=$(echo "scale=3; $response * 1000" | bc)
    
    if (( $(echo "$response < 2.0" | bc -l) )); then
        log "✅ Tempo de resposta OK (${response_time}ms)"
    else
        log "⚠️  Tempo de resposta alto (${response_time}ms)"
    fi
}

# Teste de recursos do sistema
test_system_resources() {
    log "💻 Verificando recursos do sistema..."
    
    # Verificar uso de memória dos containers
    local containers=("finance-db" "finance-backend" "finance-frontend" "finance-caddy")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            local memory_usage=$(docker stats --no-stream --format "{{.MemUsage}}" "$container" 2>/dev/null)
            if [ -n "$memory_usage" ]; then
                log "📊 $container: Memória $memory_usage"
            fi
        else
            log "⚠️  Container $container não está rodando"
        fi
    done
    
    # Verificar espaço em disco
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        log "✅ Espaço em disco OK ($disk_usage% usado)"
    else
        log "⚠️  Espaço em disco baixo ($disk_usage% usado)"
    fi
}

# Função principal
run_smoke_tests() {
    log "🚀 Iniciando smoke tests..."
    
    local failed_tests=0
    
    test_connectivity || ((failed_tests++))
    test_authentication || ((failed_tests++))
    test_crud_operations || ((failed_tests++))
    test_database_integrity || ((failed_tests++))
    test_performance
    test_system_resources
    
    if [ $failed_tests -eq 0 ]; then
        log "🎉 Todos os smoke tests passaram!"
        return 0
    else
        log "💥 $failed_tests teste(s) falharam"
        return 1
    fi
}

# Função para executar apenas testes críticos
run_critical_tests() {
    log "🔥 Executando apenas testes críticos..."
    
    test_connectivity && test_authentication && test_database_integrity
}

# Função principal
main() {
    case "${1:-full}" in
        "full")
            run_smoke_tests
            ;;
        "critical")
            run_critical_tests
            ;;
        "quick")
            test_connectivity && test_authentication
            ;;
        *)
            echo "Uso: $0 [full|critical|quick]"
            echo "  full: executa todos os testes (padrão)"
            echo "  critical: executa apenas testes críticos"
            echo "  quick: executa apenas testes de conectividade e auth"
            exit 1
            ;;
    esac
}

main "$@"
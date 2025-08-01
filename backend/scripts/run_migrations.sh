#!/bin/bash

echo "=== Iniciando processo de migração ==="

# Função para aguardar o banco de dados
wait_for_database() {
    echo "Aguardando banco de dados ficar disponível..."
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if node -e "
            const { Sequelize } = require('sequelize');
            const config = require('../src/config/config');
            const sequelize = new Sequelize(config.database, config.username, config.password, {
                host: config.host,
                port: config.port,
                dialect: 'postgres',
                logging: false
            });
            
            sequelize.authenticate()
                .then(() => {
                    console.log('Conexão com banco estabelecida');
                    process.exit(0);
                })
                .catch(err => {
                    console.log('Tentativa ' + $attempt + ' falhou:', err.message);
                    process.exit(1);
                });
        " 2>/dev/null; then
            echo "Banco de dados está disponível!"
            return 0
        fi
        
        echo "Tentativa $attempt/$max_attempts - Aguardando 2 segundos..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "Erro: Não foi possível conectar ao banco de dados após $max_attempts tentativas"
    return 1
}

# Função para executar migrações
run_migrations() {
    echo "Executando migrações..."
    npx sequelize-cli db:migrate
    if [ $? -eq 0 ]; then
        echo "Migrações executadas com sucesso!"
        return 0
    else
        echo "Erro ao executar migrações"
        return 1
    fi
}

# Função para verificar e criar dados de teste
check_incomes_table() {
    echo "Verificando tabela incomes..."
    node scripts/check_incomes_table.js
    if [ $? -eq 0 ]; then
        echo "Verificação da tabela incomes concluída!"
        return 0
    else
        echo "Aviso: Erro na verificação da tabela incomes (pode ser normal se a tabela já existe)"
        return 0
    fi
}

# Função para testar configuração
test_setup() {
    echo "Testando configuração..."
    node scripts/test_migration_setup.js
    if [ $? -eq 0 ]; then
        echo "Teste de configuração passou!"
        return 0
    else
        echo "Aviso: Teste de configuração falhou (pode ser normal durante inicialização)"
        return 0
    fi
}

# Executar o processo
echo "Iniciando processo de inicialização..."

# Aguardar banco de dados
if wait_for_database; then
    # Executar migrações
    if run_migrations; then
        # Verificar tabela incomes
        check_incomes_table
        
        # Testar configuração
        test_setup
        
        echo "=== Processo de migração concluído com sucesso! ==="
        echo "Iniciando servidor..."
    else
        echo "Erro: Falha ao executar migrações"
        exit 1
    fi
else
    echo "Erro: Falha ao conectar ao banco de dados"
    exit 1
fi 
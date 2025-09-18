#!/bin/bash

# Script para configurar o cron job de backup diário
# Este script deve ser executado com privilégios de superusuário

# Verificar se está sendo executado como root
if [ "$(id -u)" -ne 0 ]; then
    echo "Este script deve ser executado como root (sudo)."
    exit 1
fi

# Caminho absoluto para o script de backup
SCRIPT_PATH="$(readlink -f $(dirname $0))/backup.sh"

# Verificar se o script de backup existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Erro: Script de backup não encontrado em $SCRIPT_PATH"
    exit 1
fi

# Tornar o script executável
chmod +x "$SCRIPT_PATH"
echo "Script de backup configurado como executável."

# Configurar cron job para executar diariamente às 2:00 AM
CRON_JOB="0 2 * * * $SCRIPT_PATH > /dev/null 2>&1"

# Verificar se o cron job já existe
EXISTING_CRON=$(crontab -l 2>/dev/null | grep -F "$SCRIPT_PATH")

if [ -z "$EXISTING_CRON" ]; then
    # Adicionar novo cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "Cron job configurado com sucesso. Backup será executado diariamente às 2:00 AM."
else
    echo "Cron job já está configurado."
fi

echo "Configuração concluída!"
echo "Para verificar a configuração do cron, execute: crontab -l"
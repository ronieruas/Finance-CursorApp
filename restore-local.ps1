# Script de restauração para Windows
# Adaptado do script original restore.sh

# Forçar UTF-8 no PowerShell para evitar mojibake ao imprimir/logar
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

# Configurações
$BackupDir = ".\database\backups"
$DbName = "finance"
$DbUser = "finance"

# Função para registrar logs
function Log {
    param (
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

# Verificar se o diretório de backup existe
if (-not (Test-Path $BackupDir)) {
    Write-Host "Erro: Diretório de backup não encontrado: $BackupDir"
    exit 1
}

# Verificar se existem backups
$Backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
if ($Backups.Count -eq 0) {
    Write-Host "Erro: Nenhum backup encontrado em $BackupDir"
    exit 1
}

# Mostrar backups disponíveis
Write-Host "Backups disponíveis:"
for ($i = 0; $i -lt $Backups.Count; $i++) {
    Write-Host "$($i+1). $($Backups[$i].Name) - Criado em: $($Backups[$i].LastWriteTime)"
}
Write-Host ""

# Solicitar qual backup restaurar
$BackupNumber = Read-Host "Digite o número do backup que deseja restaurar ou 'q' para sair"

if ($BackupNumber -eq "q") {
    Write-Host "Operação cancelada pelo usuário."
    exit 0
}

# Validar entrada
try {
    $BackupIndex = [int]$BackupNumber - 1
    if ($BackupIndex -lt 0 -or $BackupIndex -ge $Backups.Count) {
        throw "Índice inválido"
    }
} catch {
    Write-Host "Erro: Número de backup inválido."
    exit 1
}

# Selecionar o backup
$SelectedBackup = $Backups[$BackupIndex]
Log "Iniciando restauração do backup: $($SelectedBackup.Name)"

# Confirmar restauração
Write-Host "ATENÇÃO: Esta operação irá substituir todos os dados atuais do banco de dados!"
$Confirm = Read-Host "Digite 'sim' para confirmar a restauração"

if ($Confirm -ne "sim") {
    Write-Host "Restauração cancelada pelo usuário."
    exit 0
}

# Restaurar o backup
Log "Restaurando banco de dados..."

# Passo 1: Limpar schema public
docker exec -i finance-db env PGCLIENTENCODING=UTF8 psql -U $DbUser -d $DbName -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao limpar o banco de dados"
    exit 1
}

# Passo 2: Copiar o arquivo de backup diretamente para dentro do container para evitar conversões de encoding do PowerShell
$ContainerBackupPath = "/tmp/restore.sql"
Log "Copiando backup para o container: $ContainerBackupPath"
docker cp $SelectedBackup.FullName finance-db:$ContainerBackupPath
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao copiar o arquivo de backup para o container"
    exit 1
}

# Passo 2.5: Detectar se o backup contém comandos de nível de banco (DROP/CREATE DATABASE ou \connect)
$ContainsDbLevelOps = Select-String -Path $SelectedBackup.FullName -Pattern 'DROP\s+DATABASE|CREATE\s+DATABASE|\\connect\s+finance' -Quiet
if ($ContainsDbLevelOps) {
    $TargetDb = "postgres"
    Log "Backup contém DROP/CREATE DATABASE ou \\connect; conectando ao banco '$TargetDb' para aplicar."
} else {
    $TargetDb = $DbName
    Log "Backup sem comandos de nível de banco; conectando ao banco '$TargetDb'."
}

# Passo 3: Executar o psql dentro do container lendo o arquivo diretamente
Log "Aplicando backup via psql (-f) com UTF-8"
docker exec -i finance-db env PGCLIENTENCODING=UTF8 psql -U $DbUser -d $TargetDb -v ON_ERROR_STOP=1 -f $ContainerBackupPath
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao restaurar o backup"
    exit 1
}

Log "Restauração concluída com sucesso!"
Write-Host "O banco de dados foi restaurado com sucesso a partir do backup: $($SelectedBackup.Name)"
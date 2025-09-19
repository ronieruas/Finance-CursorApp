# Script de restauração para Windows
# Adaptado do script original restore.sh

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
docker exec -i finance-db psql -U $DbUser -d $DbName -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao limpar o banco de dados"
    exit 1
}

Get-Content -Encoding UTF8 $SelectedBackup.FullName | docker exec -i finance-db psql -U $DbUser -d $DbName
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao restaurar o backup"
    exit 1
}

Log "Restauração concluída com sucesso!"
Write-Host "O banco de dados foi restaurado com sucesso a partir do backup: $($SelectedBackup.Name)"
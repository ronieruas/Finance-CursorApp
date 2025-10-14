# Script de backup para Windows
# Adaptado do script original backup.sh

# Configurações
$BackupDir = ".\database\backups"
$DbName = "finance"
$DbUser = "finance"
$DateFormat = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupName = "backup-local-$DateFormat"
$BackupFile = "$BackupDir\$BackupName.sql"

# Função para registrar logs
function Log {
    param (
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

# Criar diretório de backup se não existir
if (-not (Test-Path $BackupDir)) {
    New-Item -Path $BackupDir -ItemType Directory | Out-Null
    Log "Diretório de backup criado: $BackupDir"
}

# Iniciar processo de backup
Log "Iniciando backup: $BackupName"

# Backup do banco de dados usando Docker
Log "Realizando backup do banco de dados..."
# Gerar o dump diretamente dentro do container e copiar o arquivo, evitando stdout PowerShell
$ContainerDumpPath = "/tmp/backup-local.sql"
docker exec finance-db bash -lc "pg_dump -U $DbUser -d $DbName --encoding=UTF8 > $ContainerDumpPath"
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao gerar dump dentro do container"
    exit 1
}
docker cp finance-db:$ContainerDumpPath $BackupFile
if ($LASTEXITCODE -ne 0) {
    Log "ERRO: Falha ao copiar dump do container"
    exit 1
}
Log "Backup do banco de dados concluído com sucesso: $BackupFile"

# Limitar número de backups (manter apenas os 7 mais recentes)
$Backups = Get-ChildItem -Path $BackupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending
if ($Backups.Count -gt 7) {
    Log "Removendo backups antigos..."
    $Backups | Select-Object -Skip 7 | ForEach-Object {
        Remove-Item $_.FullName -Force
        Log "Backup antigo removido: $($_.Name)"
    }
}

Log "Processo de backup concluído com sucesso!"
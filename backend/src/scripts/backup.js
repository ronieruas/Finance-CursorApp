const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Função simples para formatar data como YYYY-MM-DD_HH-mm-ss (sem depender de dayjs)
function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${MM}-${dd}_${HH}-${mm}-${ss}`;
}

// O diretório de backups agora estará na raiz do projeto
const backupDir = path.join(__dirname, '..', '..', '..', 'database', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// As variáveis de ambiente são definidas no docker-compose.yml
const dbConfig = {
  user: 'finance',
  database: 'finance',
  container: 'finance-db'
};

const date = formatTimestamp();
const backupFile = path.join(backupDir, `backup-${date}.sql`);

// Comando para executar o pg_dump dentro do contêiner Docker
// --clean / --if-exists / --create facilitam o restore limpo
const command = `docker exec ${dbConfig.container} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} --clean --if-exists --create > "${backupFile}"`;

console.log('Iniciando o backup do banco de dados...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao fazer backup: ${error.message}`);
    return;
  }
  if (stderr && stderr.trim().length > 0) {
    console.warn(`Avisos do pg_dump: ${stderr}`);
  }
  console.log(`Backup concluído com sucesso! Arquivo: ${backupFile}`);
  if (stdout && stdout.trim().length > 0) {
    console.log(stdout);
  }
});
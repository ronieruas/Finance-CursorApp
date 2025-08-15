const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

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

const date = dayjs().format('YYYY-MM-DD_HH-mm-ss');
const backupFile = path.join(backupDir, `backup-${date}.sql`);

// Comando para executar o pg_dump dentro do contêiner Docker
const command = `docker exec ${dbConfig.container} pg_dump -U ${dbConfig.user} -d ${dbConfig.database} --clean --if-exists --create > "${backupFile}"`;


console.log('Iniciando o backup do banco de dados...');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao fazer backup: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Erro no pg_dump: ${stderr}`);
    return;
  }
  console.log(`Backup concluído com sucesso! Arquivo: ${backupFile}`);
  console.log(stdout);
});
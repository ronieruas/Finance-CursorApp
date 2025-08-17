const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// O diretório de backups agora estará na raiz do projeto
const backupDir = path.join(__dirname, '..', '..', '..', 'database', 'backups');

const getLatestBackup = () => {
  if (!fs.existsSync(backupDir)) {
    return null;
  }
  const files = fs.readdirSync(backupDir);
  const backups = files.filter(file => file.endsWith('.sql')).sort().reverse();
  return backups.length > 0 ? path.join(backupDir, backups[0]) : null;
};

const latestBackupFile = getLatestBackup();

if (!latestBackupFile) {
  console.error('Nenhum arquivo de backup encontrado.');
  process.exit(1);
}

// As variáveis de ambiente são definidas no docker-compose.yml
const dbConfig = {
  user: 'finance',
  database: 'finance',
  container: 'finance-db'
};

// Detectar SO para escolher o comando de leitura adequado
const isWin = process.platform === 'win32';
const readerCmd = isWin ? 'type' : 'cat';

// Heurística: verificar se o dump contém CREATE DATABASE para decidir o alvo do psql
let dumpHasCreateDatabase = false;
try {
  const fd = fs.openSync(latestBackupFile, 'r');
  const buffer = Buffer.alloc(8192);
  const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  const head = buffer.toString('utf8', 0, bytesRead);
  dumpHasCreateDatabase = /CREATE\s+DATABASE/i.test(head);
} catch (e) {
  console.warn('Aviso: não foi possível inspecionar o arquivo de backup. Prosseguindo com estratégia padrão.');
}

const restoreTargetDb = dumpHasCreateDatabase ? 'postgres' : dbConfig.database;

const dropDbCommand = `docker exec ${dbConfig.container} psql -U ${dbConfig.user} -d postgres -c "DROP DATABASE IF EXISTS ${dbConfig.database} WITH (FORCE);"`;
const createDbCommand = `docker exec ${dbConfig.container} psql -U ${dbConfig.user} -d postgres -c "CREATE DATABASE ${dbConfig.database};"`;
const restoreCommand = `${readerCmd} "${latestBackupFile}" | docker exec -i ${dbConfig.container} psql -v ON_ERROR_STOP=1 -U ${dbConfig.user} -d ${restoreTargetDb}`;

console.log('Iniciando o processo de restauração...');

function execProm(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

(async () => {
  try {
    if (!dumpHasCreateDatabase) {
      // Dump sem CREATE DATABASE: dropar e recriar alvo antes do restore
      await execProm(dropDbCommand);
      console.log('Banco de dados antigo removido (se existia).');
      await execProm(createDbCommand);
      console.log('Novo banco de dados criado com sucesso.');
    } else {
      console.log('Dump contém CREATE DATABASE: restaurando conectado ao banco postgres.');
    }

    console.log(`Iniciando a restauração a partir de: ${latestBackupFile}`);
    const { stdout, stderr } = await execProm(restoreCommand);

    if (stderr && stderr.trim().length > 0) {
      // Exibir stderr para transparência; ON_ERROR_STOP faz o comando falhar em erros sérios
      console.warn(`Mensagens do psql: ${stderr}`);
    }
    if (stdout && stdout.trim().length > 0) {
      console.log(stdout);
    }
    console.log('Restauração concluída com sucesso!');
  } catch (e) {
    console.error('Erro ao restaurar o backup.');
    if (e.stderr) console.error(e.stderr);
    if (e.stdout) console.error(e.stdout);
    if (e.error) console.error(e.error.message);
    process.exit(1);
  }
})();
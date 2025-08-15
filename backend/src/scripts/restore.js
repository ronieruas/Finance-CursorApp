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

// Comando para executar o psql dentro do contêiner Docker para restaurar o banco de dados
const dropDbCommand = `docker exec ${dbConfig.container} psql -U ${dbConfig.user} -d postgres -c "DROP DATABASE IF EXISTS ${dbConfig.database} WITH (FORCE);"`;
const createDbCommand = `docker exec ${dbConfig.container} psql -U ${dbConfig.user} -d postgres -c "CREATE DATABASE ${dbConfig.database};"`;
const restoreCommand = `type "${latestBackupFile}" | docker exec -i ${dbConfig.container} psql -U ${dbConfig.user} -d ${dbConfig.database}`;

console.log('Iniciando o processo de restauração...');

exec(dropDbCommand, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao dropar o banco de dados: ${error.message}`);
    // Mesmo com erro, tentamos continuar, pois o DB pode não existir.
  }
  console.log('Banco de dados antigo removido (se existia).');

  exec(createDbCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao criar o banco de dados: ${error.message}`);
      return;
    }
    console.log('Novo banco de dados criado com sucesso.');

    console.log(`Iniciando a restauração a partir de: ${latestBackupFile}`);
    exec(restoreCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao restaurar: ${error.message}`);
        return;
      }
      if (stderr && !stderr.includes('already exists') && !stderr.includes('does not exist')) {
          // Filtramos os erros comuns de "already exists" que não são fatais na restauração
          console.warn(`Mensagens do psql: ${stderr}`);
      }
      console.log('Restauração concluída com sucesso!');
    });
  });
});
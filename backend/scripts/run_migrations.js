const { exec } = require('child_process');
const path = require('path');

console.log('Executando migrações...');

// Executar migrações do Sequelize
exec('npx sequelize db:migrate', { 
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, NODE_ENV: 'development' }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Erro ao executar migrações:', error);
    console.error('stderr:', stderr);
    return;
  }
  
  console.log('Migrações executadas com sucesso:');
  console.log(stdout);
  
  // Executar o script de teste da tabela
  console.log('\nTestando tabela transfers...');
  require('./test_transfers_table.js');
}); 
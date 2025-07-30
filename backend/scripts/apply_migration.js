const sequelize = require('../src/config/database');

async function applyMigration() {
  try {
    console.log('Aplicando migração para permitir null em to_account_id...');
    
    // Executar a migração diretamente
    await sequelize.query(`
      ALTER TABLE transfers 
      ALTER COLUMN to_account_id DROP NOT NULL;
    `);
    
    console.log('Migração aplicada com sucesso!');
    
    // Verificar a estrutura da tabela
    const [results] = await sequelize.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transfers' AND column_name = 'to_account_id';
    `);
    
    console.log('Estrutura atual da coluna to_account_id:', results[0]);
    
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  } finally {
    await sequelize.close();
  }
}

applyMigration(); 
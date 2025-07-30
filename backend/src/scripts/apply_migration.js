const { sequelize } = require('../models');

async function applyMigration() {
  try {
    console.log('Aplicando migração: adicionando credit_card_id à tabela budgets...');
    
    // Adicionar coluna credit_card_id
    await sequelize.query(`
      ALTER TABLE budgets 
      ADD COLUMN IF NOT EXISTS credit_card_id INTEGER REFERENCES credit_cards(id) ON UPDATE CASCADE ON DELETE SET NULL;
    `);
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar se a coluna foi criada
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'budgets' AND column_name = 'credit_card_id';
    `);
    
    if (results.length > 0) {
      console.log('✅ Coluna credit_card_id criada com sucesso');
      console.log('Detalhes:', results[0]);
    } else {
      console.log('❌ Coluna não foi criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  applyMigration();
}

module.exports = { applyMigration }; 
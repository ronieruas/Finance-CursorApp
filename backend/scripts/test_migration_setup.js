const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

async function testMigrationSetup() {
  try {
    console.log('=== Testando configuração de migração ===');
    
    // Testar conexão com banco
    const sequelize = new Sequelize(config.database, config.username, config.password, {
      host: config.host,
      port: config.port,
      dialect: 'postgres',
      logging: false
    });
    
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar se as tabelas existem
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Tabelas existentes:', tables);
    
    // Verificar se a tabela incomes existe
    if (tables.includes('incomes')) {
      console.log('✅ Tabela incomes existe');
      
      // Verificar dados na tabela incomes
      const [results] = await sequelize.query('SELECT COUNT(*) as count FROM incomes');
      console.log('📊 Registros na tabela incomes:', results[0].count);
      
      if (results[0].count > 0) {
        const [incomes] = await sequelize.query('SELECT * FROM incomes ORDER BY created_at DESC LIMIT 3');
        console.log('📝 Últimas 3 receitas:', incomes);
      }
    } else {
      console.log('❌ Tabela incomes não existe');
    }
    
    // Verificar se a tabela expenses existe
    if (tables.includes('expenses')) {
      console.log('✅ Tabela expenses existe');
    } else {
      console.log('❌ Tabela expenses não existe');
    }
    
    await sequelize.close();
    console.log('=== Teste concluído ===');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    process.exit(1);
  }
}

testMigrationSetup(); 
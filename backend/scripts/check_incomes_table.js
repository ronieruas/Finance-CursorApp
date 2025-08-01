const { Sequelize } = require('sequelize');
const config = require('../src/config/config');

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'postgres',
  logging: false
});

async function checkIncomesTable() {
  try {
    console.log('Verificando tabela incomes...');
    
    // Verificar se a tabela existe
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('Tabelas existentes:', tableExists);
    
    if (!tableExists.includes('incomes')) {
      console.log('Tabela incomes não existe. Criando...');
      
      // Criar a tabela manualmente
      await sequelize.getQueryInterface().createTable('incomes', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        account_id: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        description: {
          type: Sequelize.STRING,
          allowNull: false
        },
        value: {
          type: Sequelize.DECIMAL(14,2),
          allowNull: false
        },
        date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        category: {
          type: Sequelize.STRING
        },
        is_recurring: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      
      console.log('Tabela incomes criada com sucesso!');
    } else {
      console.log('Tabela incomes já existe.');
    }
    
    // Verificar se há dados na tabela
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM incomes');
    console.log('Quantidade de registros na tabela incomes:', results[0].count);
    
    // Se não há dados, inserir alguns dados de teste
    if (results[0].count === 0) {
      console.log('Inserindo dados de teste...');
      
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      await sequelize.query(`
        INSERT INTO incomes (user_id, account_id, description, value, date, category, is_recurring, created_at, updated_at)
        VALUES 
        (1, 1, 'Salário Janeiro', 5000.00, '${primeiroDiaMes.toISOString().split('T')[0]}', 'Salário', false, NOW(), NOW()),
        (1, 1, 'Freelance', 1500.00, '${hoje.toISOString().split('T')[0]}', 'Trabalho Extra', false, NOW(), NOW()),
        (1, 1, 'Bônus', 800.00, '${hoje.toISOString().split('T')[0]}', 'Bônus', false, NOW(), NOW())
      `);
      
      console.log('Dados de teste inseridos com sucesso!');
    }
    
    // Verificar dados inseridos
    const [incomes] = await sequelize.query('SELECT * FROM incomes ORDER BY created_at DESC LIMIT 5');
    console.log('Últimas 5 receitas:', incomes);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

checkIncomesTable(); 
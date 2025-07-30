const sequelize = require('../src/config/database');
const { Transfer, Account } = require('../src/models');

async function testTransfersTable() {
  try {
    console.log('Testando conexão com o banco...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    console.log('Verificando se a tabela transfers existe...');
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('Tabelas existentes:', tableExists);

    if (tableExists.includes('transfers')) {
      console.log('Tabela transfers existe!');
      
      // Testar estrutura da tabela
      const tableDescription = await sequelize.getQueryInterface().describeTable('transfers');
      console.log('Estrutura da tabela transfers:', tableDescription);
      
      // Testar criação de uma transferência
      console.log('Testando criação de transferência...');
      const testTransfer = await Transfer.create({
        user_id: 1,
        from_account_id: null,
        to_account_id: 1,
        value: 100.00,
        description: 'Teste de transferência',
        date: '2025-07-30'
      });
      console.log('Transferência criada com sucesso:', testTransfer.id);
      
      // Remover a transferência de teste
      await testTransfer.destroy();
      console.log('Transferência de teste removida.');
      
    } else {
      console.log('Tabela transfers não existe. Executando migrações...');
      await sequelize.sync({ force: false });
      console.log('Migrações executadas.');
    }

  } catch (error) {
    console.error('Erro:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

testTransfersTable(); 
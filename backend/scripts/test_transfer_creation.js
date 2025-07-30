const { Transfer, Account } = require('../src/models');
const sequelize = require('../src/config/database');

async function testTransferCreation() {
  try {
    console.log('Testando criação de transferência de terceiros...');
    
    // Verificar estrutura da tabela
    const tableInfo = await sequelize.query(
      "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'transfers' AND column_name = 'from_account_id'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('Informações da coluna from_account_id:', tableInfo);
    
    // Tentar criar uma transferência de terceiros
    const testTransfer = await Transfer.create({
      user_id: 1,
      from_account_id: null,
      to_account_id: 1,
      value: 100.00,
      description: 'Teste transferência terceiros',
      date: '2025-07-30'
    });
    
    console.log('Transferência criada com sucesso:', testTransfer.toJSON());
    
    // Limpar o teste
    await testTransfer.destroy();
    console.log('Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await sequelize.close();
  }
}

testTransferCreation(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:80';

async function createTestCards() {
  try {
    console.log('=== CRIANDO CARTÕES DE TESTE ===\n');

    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teste@teste.com',
      password: 'Teste123!'
    });

    const token = loginResponse.data.token;
    console.log('Login realizado com sucesso!\n');

    // Criar cartão com fechamento no dia 28 (problema reportado)
    console.log('Criando cartão com fechamento no dia 28...');
    try {
      const card1 = await axios.post(`${BASE_URL}/api/creditCards`, {
        name: 'Cartão Teste 28',
        limit_value: 5000,
        closing_day: 28,
        due_day: 15,
        bank: 'Banco Teste',
        brand: 'Visa',
        status: 'ativa'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Cartão criado: ${card1.data.name} (ID: ${card1.data.id})`);
      console.log('Resposta completa:', JSON.stringify(card1.data, null, 2));
    } catch (error) {
      console.error('Erro ao criar cartão 28:', error.response?.data || error.message);
    }

    // Criar cartão com fechamento no dia 15 para comparação
    console.log('Criando cartão com fechamento no dia 15...');
    try {
      const card2 = await axios.post(`${BASE_URL}/api/creditCards`, {
        name: 'Cartão Teste 15',
        limit_value: 3000,
        closing_day: 15,
        due_day: 5,
        bank: 'Banco Teste',
        brand: 'Mastercard',
        status: 'ativa'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Cartão criado: ${card2.data.name} (ID: ${card2.data.id})`);
    } catch (error) {
      console.error('Erro ao criar cartão 15:', error.response?.data || error.message);
    }

    // Criar cartão com fechamento no dia 5 para mais testes
    console.log('Criando cartão com fechamento no dia 5...');
    try {
      const card3 = await axios.post(`${BASE_URL}/api/creditCards`, {
        name: 'Cartão Teste 5',
        limit_value: 2000,
        closing_day: 5,
        due_day: 25,
        bank: 'Banco Teste',
        brand: 'Elo',
        status: 'ativa'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Cartão criado: ${card3.data.name} (ID: ${card3.data.id})`);
    } catch (error) {
      console.error('Erro ao criar cartão 5:', error.response?.data || error.message);
    }

    console.log('\n=== ADICIONANDO DESPESAS DE TESTE ===\n');

    // Vamos tentar criar despesas apenas se conseguirmos criar pelo menos um cartão
    // Para isso, vamos buscar os cartões criados
    try {
      const cardsResponse = await axios.get(`${BASE_URL}/api/creditCards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cards = cardsResponse.data;
      console.log(`Encontrados ${cards.length} cartões após criação`);
      
      if (cards.length > 0) {
        const card = cards[0]; // Usar o primeiro cartão encontrado
        
        // Adicionar algumas despesas para o cartão
        // Despesas do mês passado (já deveriam estar na fatura fechada)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(15); // Data antes do fechamento

        console.log('Adicionando despesa do mês passado (deveria estar na fatura fechada)...');
         await axios.post(`${BASE_URL}/api/expenses`, {
           description: 'Compra Teste Mês Passado',
           value: 150.00,
           due_date: lastMonth.toISOString().split('T')[0],
           category: 'Compras',
           credit_card_id: card.id,
           type: 'cartao'
         }, {
           headers: { Authorization: `Bearer ${token}` }
         });

         // Despesas do mês atual (deveriam estar na fatura aberta)
         const thisMonth = new Date();
         thisMonth.setDate(10); // Data antes do fechamento atual

         console.log('Adicionando despesa do mês atual (deveria estar na fatura aberta)...');
         await axios.post(`${BASE_URL}/api/expenses`, {
           description: 'Compra Teste Mês Atual',
           value: 250.00,
           due_date: thisMonth.toISOString().split('T')[0],
           category: 'Alimentação',
           credit_card_id: card.id,
           type: 'cartao'
         }, {
           headers: { Authorization: `Bearer ${token}` }
         });
        
        console.log('Despesas adicionadas com sucesso!');
      } else {
        console.log('Nenhum cartão encontrado para adicionar despesas.');
      }
    } catch (error) {
      console.error('Erro ao adicionar despesas:', error.response?.data || error.message);
    }

    console.log('\n=== CARTÕES DE TESTE CRIADOS COM SUCESSO ===');
    console.log('Agora você pode executar o script de debug para verificar o problema de fechamento.');

  } catch (error) {
    console.error('Erro ao criar cartões de teste:', error.response?.data || error.message);
  }
}

createTestCards();
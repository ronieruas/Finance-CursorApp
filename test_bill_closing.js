const axios = require('axios');

const BASE_URL = 'http://localhost';

async function testBillClosing() {
  try {
    console.log('=== TESTE DO SERVIÇO DE FECHAMENTO DE FATURAS ===\n');

    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'teste@teste.com',
      password: 'Teste123!'
    });

    const token = loginResponse.data.token;
    console.log('✓ Login realizado com sucesso');
    console.log('Token:', token);

    // Headers com autenticação
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Buscar cartões
    console.log('\n2. Buscando cartões existentes...');
    const cardsResponse = await axios.get(`${BASE_URL}/creditCards/`, { headers });
    const cards = cardsResponse.data;
    console.log(`✓ Encontrados ${cards.length} cartões`);

    if (cards.length === 0) {
      console.log('❌ Nenhum cartão encontrado para testar');
      return;
    }

    // 3. Testar rota should-close para cada cartão
    console.log('\n3. Verificando se algum cartão deve ser fechado hoje...');
    for (const card of cards) {
      console.log(`   Cartão: ${card.name} - Dia de fechamento: ${card.closingDay} - Hoje: ${new Date().getDate()}`);
      
      try {
        const shouldCloseResponse = await axios.get(`${BASE_URL}/bill-closing/should-close/${card.id}`, { headers });
        console.log(`   ✓ Should close response:`, shouldCloseResponse.data);
      } catch (error) {
        console.log(`   ❌ Erro ao verificar should-close para cartão ${card.id}:`, error.response?.data || error.message);
      }
    }

    // 4. Testar processo de fechamento automático
    console.log('\n4. Testando processo de fechamento automático...');
    try {
      const processResponse = await axios.post(`${BASE_URL}/bill-closing/process`, {}, { headers });
      console.log('✓ Processo de fechamento executado com sucesso:', processResponse.data);
    } catch (error) {
      console.log('❌ Erro no processo de fechamento:', error.response?.data || error.message);
    }

    console.log('\n=== TESTE CONCLUÍDO ===');

  } catch (error) {
    console.error('Erro no teste:', error.response?.data || error.message);
  }
}

testBillClosing();
const axios = require('axios');

const BASE_URL = 'http://localhost:80';

async function createTestUser() {
  try {
    console.log('=== CRIANDO USUÁRIO DE TESTE ===\n');

    // Criar usuário de teste
    console.log('Criando usuário de teste...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Usuário Teste',
      email: 'teste@teste.com',
      password: 'Teste123!'
    });
    
    console.log('✓ Usuário criado com sucesso:', registerResponse.data);
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('já está em uso')) {
      console.log('✓ Usuário já existe, pode prosseguir com os testes');
    } else {
      console.error('Erro ao criar usuário:', error.response?.data || error.message);
    }
  }
}

createTestUser();
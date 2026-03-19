const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function testIntegration() {
  console.log('🧪 Testando integração Mobile-Backend...\n');

  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // 2. Testar registro de usuário
    console.log('\n2. Testando registro de usuário...');
    const testUser = {
      name: 'Usuário Teste Mobile',
      email: 'teste.mobile@example.com',
      password: 'MinhaSenh@123'
    };

    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      console.log('✅ Registro realizado:', registerResponse.data);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('já existe')) {
        console.log('ℹ️  Usuário já existe, continuando...');
      } else {
        throw error;
      }
    }

    // 3. Testar login
    console.log('\n3. Testando login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login realizado:', {
      user: loginResponse.data.user,
      tokenExists: !!loginResponse.data.token
    });

    const token = loginResponse.data.token;

    // 4. Testar acesso a rota protegida (contas)
    console.log('\n4. Testando acesso a rota protegida (contas)...');
    const accountsResponse = await axios.get(`${BASE_URL}/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Contas obtidas:', accountsResponse.data);

    // 5. Testar acesso a dashboard
    console.log('\n5. Testando acesso ao dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Dashboard obtido:', Object.keys(dashboardResponse.data));

    console.log('\n🎉 Todos os testes passaram! A integração está funcionando corretamente.');

  } catch (error) {
    console.error('❌ Erro na integração:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    process.exit(1);
  }
}

testIntegration();
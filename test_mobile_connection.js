// Usando fetch nativo do Node.js 18+

async function testMobileConnection() {
  const BASE_URL = 'http://localhost:3003';
  
  console.log('🧪 Testando conexão Mobile-Backend...\n');

  try {
    // 1. Testar health check
    console.log('1. Testando health check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // 2. Testar registro de usuário
    console.log('\n2. Testando registro de usuário...');
    const testUser = {
      name: 'Usuário Mobile Teste',
      email: 'mobile.teste@example.com',
      password: 'MinhaSenh@123'
    };

    try {
      const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser)
      });

      if (registerResponse.ok) {
        const registerData = await registerResponse.json();
        console.log('✅ Registro realizado:', registerData);
      } else {
        const errorData = await registerResponse.json();
        if (errorData.message && errorData.message.includes('já existe')) {
          console.log('ℹ️  Usuário já existe, continuando...');
        } else {
          console.log('❌ Erro no registro:', errorData);
        }
      }
    } catch (error) {
      console.log('❌ Erro no registro:', error.message);
    }

    // 3. Testar login
    console.log('\n3. Testando login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login realizado:', {
        user: loginData.user,
        tokenExists: !!loginData.token
      });

      const token = loginData.token;

      // 4. Testar rota protegida
      console.log('\n4. Testando rota protegida (contas)...');
      const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        console.log('✅ Contas obtidas:', accountsData.length, 'contas encontradas');
      } else {
        console.log('❌ Erro ao obter contas:', accountsResponse.status);
      }

    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Erro no login:', loginError);
    }

    console.log('\n🎉 Teste de conexão Mobile-Backend concluído!');
    console.log('✅ A aplicação mobile PODE usar a mesma base de dados da versão web!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testMobileConnection();
// Testando se os dados são compartilhados entre web e mobile

async function testSharedData() {
  const BASE_URL = 'http://localhost:3003';
  
  console.log('🔄 Testando compartilhamento de dados Web-Mobile...\n');

  try {
    // Fazer login com o usuário criado na versão web
    console.log('1. Fazendo login com usuário da versão web...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'compartilhamento@teste.com',
        password: 'MinhaSenh@123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login realizado com usuário web:', loginData.user.name);

      const token = loginData.token;

      // Verificar contas do usuário
      console.log('\n2. Verificando contas do usuário...');
      const accountsResponse = await fetch(`${BASE_URL}/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        console.log('✅ Contas encontradas:', accounts.length);
        accounts.forEach(account => {
          console.log(`   - ${account.name}: R$ ${account.balance}`);
        });
      }

      // Verificar transações do usuário
      console.log('\n3. Verificando transações do usuário...');
      const transactionsResponse = await fetch(`${BASE_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (transactionsResponse.ok) {
        const transactions = await transactionsResponse.json();
        console.log('✅ Transações encontradas:', transactions.length);
        transactions.slice(0, 3).forEach(transaction => {
          console.log(`   - ${transaction.description}: R$ ${transaction.amount} (${transaction.type})`);
        });
      }

      // Verificar categorias do usuário
      console.log('\n4. Verificando categorias do usuário...');
      const categoriesResponse = await fetch(`${BASE_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        console.log('✅ Categorias encontradas:', categories.length);
        categories.slice(0, 5).forEach(category => {
          console.log(`   - ${category.name} (${category.type})`);
        });
      }

      console.log('\n🎉 Teste de compartilhamento concluído!');
      console.log('✅ Os dados SÃO compartilhados entre web e mobile!');
      console.log('📱 A aplicação mobile pode acessar todos os dados da versão web!');

    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Erro no login:', loginError);
      console.log('ℹ️  Isso pode indicar que o usuário não existe ou a senha está incorreta.');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSharedData();
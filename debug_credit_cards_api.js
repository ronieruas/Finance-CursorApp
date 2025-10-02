const axios = require('axios');

async function debugCreditCardsAPI() {
  try {
    console.log('=== DEBUG CARTÕES DE CRÉDITO VIA API ===\n');
    
    // Primeiro, fazer login para obter o token
    console.log('Fazendo login...');
    const loginResponse = await axios.post('http://localhost:80/auth/login', {
      email: 'user@example.com', // Usuário padrão do seeder
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login realizado com sucesso!\n');
    
    // Buscar cartões de crédito
     const cardsResponse = await axios.get(`http://localhost:80/api/creditCards`, {
       headers: { Authorization: `Bearer ${token}` }
     });
    
    const cards = cardsResponse.data;
    console.log(`Encontrados ${cards.length} cartões de crédito:`);
    
    // Filtrar cartões com fechamento no dia 28
    const cards28 = cards.filter(card => card.closing_day === 28);
    console.log(`\nCartões com fechamento no dia 28: ${cards28.length}`);
    
    for (const card of cards28) {
      console.log(`\n--- Cartão: ${card.name} (${card.bank || 'Sem banco'}) ---`);
      console.log(`ID: ${card.id}`);
      console.log(`Fechamento: dia ${card.closing_day}`);
      console.log(`Vencimento: dia ${card.due_day}`);
      console.log(`Status: ${card.status}`);
      console.log(`Limite: R$ ${card.limit_value}`);
      
      // Buscar fatura atual do cartão
      try {
        const billResponse = await axios.get(`http://localhost:80/api/creditCards/${card.id}/bill`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const bill = billResponse.data;
        console.log(`\nFatura atual:`);
        console.log(`  - Período: ${bill.periods?.atual?.start_date} até ${bill.periods?.atual?.end_date}`);
        console.log(`  - Status: ${bill.atual?.length > 0 ? 'Com despesas' : 'Sem despesas'}`);
        console.log(`  - Total: R$ ${bill.atual?.reduce((acc, exp) => acc + Number(exp.value), 0) || 0}`);
        console.log(`  - Despesas: ${bill.atual?.length || 0}`);
        
        if (bill.atual && bill.atual.length > 0) {
          console.log(`  - Últimas despesas:`);
          bill.atual.slice(0, 5).forEach(expense => {
            console.log(`    * ${expense.description}: R$ ${expense.value} (${expense.due_date})`);
          });
        }
        
        // Analisar se deveria estar fechada
        const hoje = new Date();
        const dataFechamento = new Date();
        dataFechamento.setDate(card.closing_day);
        
        // Se já passou do dia de fechamento deste mês
        if (hoje.getDate() > card.closing_day) {
          console.log(`\n⚠️  ANÁLISE: Hoje é dia ${hoje.getDate()}, já passou do fechamento (dia ${card.closing_day})`);
          console.log(`Status da fatura: ${bill.atual?.length > 0 ? 'Com despesas' : 'Sem despesas'}`);
          
          // Verificar se há despesas na fatura atual que deveriam ter sido fechadas
          if (bill.atual && bill.atual.length > 0) {
            console.log(`🔴 PROBLEMA: Há ${bill.atual.length} despesas na fatura atual que deveriam estar na fatura fechada`);
          } else {
            console.log(`✅ OK: Não há despesas na fatura atual`);
          }
        } else {
          console.log(`\n✅ OK: Ainda não passou do dia de fechamento (${card.closing_day})`);
        }
        
      } catch (billError) {
        console.log(`\nErro ao buscar fatura: ${billError.message}`);
      }
    }
    
    // Mostrar todos os cartões para contexto
    console.log(`\n=== TODOS OS CARTÕES ===`);
    cards.forEach(card => {
      console.log(`${card.name} (${card.bank || 'Sem banco'}): Fecha dia ${card.closing_day}, vence dia ${card.due_day} - Status: ${card.status}`);
    });
    
  } catch (error) {
    console.error('Erro ao debugar cartões via API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

debugCreditCardsAPI().then(() => {
  console.log('\n=== DEBUG CONCLUÍDO ===');
  process.exit(0);
}).catch(console.error);
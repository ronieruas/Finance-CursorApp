// Smoke test de transferências e extrato de contas
// Requisitos: backend rodando em http://localhost:3001 e usuário padrão disponível

const http = require('http');

function httpRequest(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const today = new Date();
  const todayDateOnly = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

  // 1) Login
  const loginRes = await httpRequest('POST', '/auth/login', {
    email: 'user@example.com',
    password: 'password123',
  });
  if (loginRes.status !== 200 || !loginRes.json?.token) {
    throw new Error(`Falha no login: ${loginRes.status} ${JSON.stringify(loginRes.json || loginRes.text)}`);
  }
  const token = loginRes.json.token;
  const userId = loginRes.json.user?.id;

  // 2) Criar contas origem e destino
  const suffix = Math.random().toString(36).slice(2, 8);
  const origemRes = await httpRequest('POST', '/accounts', {
    name: `Conta Origem Smoke ${suffix}`,
    bank: 'Banco Teste',
    type: 'corrente',
    balance: 100,
    currency: 'BRL',
  }, token);
  if (origemRes.status !== 201) {
    throw new Error(`Falha ao criar conta origem: ${origemRes.status} ${JSON.stringify(origemRes.json || origemRes.text)}`);
  }
  const origem = origemRes.json;

  const destinoRes = await httpRequest('POST', '/accounts', {
    name: `Conta Destino Smoke ${suffix}`,
    bank: 'Banco Teste',
    type: 'corrente',
    balance: 0,
    currency: 'BRL',
  }, token);
  if (destinoRes.status !== 201) {
    throw new Error(`Falha ao criar conta destino: ${destinoRes.status} ${JSON.stringify(destinoRes.json || destinoRes.text)}`);
  }
  const destino = destinoRes.json;

  // 3) Transferência de terceiros para conta destino (crédito)
  const tpParaContaRes = await httpRequest('POST', '/transfers', {
    from_account_id: null,
    to_account_id: destino.id,
    value: 50.00,
    description: 'Smoke TP→Conta',
    date: todayDateOnly,
  }, token);
  if (tpParaContaRes.status !== 201) {
    throw new Error(`Falha na transferência TP→Conta: ${tpParaContaRes.status} ${JSON.stringify(tpParaContaRes.json || tpParaContaRes.text)}`);
  }

  // 4) Transferência de conta origem para terceiros (débito)
  const contaParaTpRes = await httpRequest('POST', '/transfers', {
    from_account_id: origem.id,
    to_account_id: null,
    value: 20.00,
    description: 'Smoke Conta→TP',
    date: todayDateOnly,
  }, token);
  if (contaParaTpRes.status !== 201) {
    throw new Error(`Falha na transferência Conta→TP: ${contaParaTpRes.status} ${JSON.stringify(contaParaTpRes.json || contaParaTpRes.text)}`);
  }

  // 5) Transferência interna de origem para destino
  const internaRes = await httpRequest('POST', '/transfers', {
    from_account_id: origem.id,
    to_account_id: destino.id,
    value: 30.00,
    description: 'Smoke Interna',
    date: todayDateOnly,
  }, token);
  if (internaRes.status !== 201) {
    throw new Error(`Falha na transferência interna: ${internaRes.status} ${JSON.stringify(internaRes.json || internaRes.text)}`);
  }

  // 6) Buscar contas para validar saldos
  const contasRes = await httpRequest('GET', '/accounts', null, token);
  if (contasRes.status !== 200 || !Array.isArray(contasRes.json)) {
    throw new Error(`Falha ao listar contas: ${contasRes.status} ${JSON.stringify(contasRes.json || contasRes.text)}`);
  }
  const contas = contasRes.json;
  const origemAtual = contas.find(c => c.id === origem.id);
  const destinoAtual = contas.find(c => c.id === destino.id);
  if (!origemAtual || !destinoAtual) throw new Error('Contas criadas não encontradas na listagem.');

  const origemEsperado = 100 - 20 - 30; // 50
  const destinoEsperado = 0 + 50 + 30;  // 80

  // 7) Extrato destino: deve conter duas entradas de transferência_entrada (50 e 30)
  const extratoDestinoRes = await httpRequest('GET', `/accounts/${destino.id}/extrato?start=${firstOfMonth}&end=${endOfMonth}`, null, token);
  if (extratoDestinoRes.status !== 200 || !extratoDestinoRes.json?.extrato) {
    throw new Error(`Falha ao buscar extrato da conta destino: ${extratoDestinoRes.status} ${JSON.stringify(extratoDestinoRes.json || extratoDestinoRes.text)}`);
  }
  const extratoDestino = extratoDestinoRes.json.extrato;
  const entradasDestino = extratoDestino.filter(e => e.tipo === 'transferencia_entrada').map(e => Number(e.valor));
  const tem50 = entradasDestino.includes(50);
  const tem30 = entradasDestino.includes(30);

  // 8) Extrato origem: deve conter duas saídas de transferência_saida (-20 e -30)
  const extratoOrigemRes = await httpRequest('GET', `/accounts/${origem.id}/extrato?start=${firstOfMonth}&end=${endOfMonth}`, null, token);
  if (extratoOrigemRes.status !== 200 || !extratoOrigemRes.json?.extrato) {
    throw new Error(`Falha ao buscar extrato da conta origem: ${extratoOrigemRes.status} ${JSON.stringify(extratoOrigemRes.json || extratoOrigemRes.text)}`);
  }
  const extratoOrigem = extratoOrigemRes.json.extrato;
  const saidasOrigem = extratoOrigem.filter(e => e.tipo === 'transferencia_saida').map(e => Number(e.valor));
  const temNeg20 = saidasOrigem.includes(-20);
  const temNeg30 = saidasOrigem.includes(-30);

  const resultado = {
    user_id: userId,
    origem_id: origem.id,
    destino_id: destino.id,
    saldos: {
      origem_atual: Number(origemAtual.balance),
      origem_esperado: origemEsperado,
      destino_atual: Number(destinoAtual.balance),
      destino_esperado: destinoEsperado,
    },
    extrato_validacao: {
      destino_tem_50_e_30: tem50 && tem30,
      origem_tem_neg20_e_neg30: temNeg20 && temNeg30,
    }
  };

  console.log(JSON.stringify(resultado, null, 2));
}

main().catch((err) => {
  console.error('Erro no smoke de transferências:', err.message);
  process.exit(1);
});
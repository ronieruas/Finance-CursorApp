// Teste de exportações CSV com dados acentuados e validação de BOM/UTF-8
// Uso:
//  - BASE_URL=http://localhost:3003 node backend/scripts/test_csv_exports_utf8.js
//  - node backend/scripts/test_csv_exports_utf8.js --base-url http://localhost:3003

function parseArg(name) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  const pref = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(pref));
  if (arg) return arg.slice(pref.length);
  return undefined;
}

const cliBase = parseArg('base-url');
const baseUrl = cliBase || process.env.BASE_URL || 'http://localhost:3001';

async function postJson(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data)}`);
  }
  return data;
}

async function getJson(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data)}`);
  }
  return data;
}

async function getCsv(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const contentType = res.headers.get('content-type') || '';
  const bomBytes = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
  const decoder = new TextDecoder('utf-8');
  const text = decoder.decode(bytes);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  return { text, contentType, bomBytes, bomChar: hasBOM(text) };
}

function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return { start: fmt(first), end: fmt(last) };
}

function hasBOM(s) { return s && s.charCodeAt(0) === 0xFEFF; }

async function ensureAuth() {
  const primaryEmail = process.env.TEST_EMAIL || 'user@example.com';
  const primaryPassword = process.env.TEST_PASSWORD || 'password123';
  const devEmail = process.env.DEV_TEST_EMAIL || 'csvutf8@example.com';
  const devPassword = process.env.DEV_TEST_PASSWORD || 'StrongP@ssw0rd!';

  const tryLogin = async (email, password) => {
    try {
      const login = await postJson('/auth/login', { email, password });
      return login?.token || login?.data?.token;
    } catch (err) {
      console.warn(`Falha ao logar com ${email}:`, err.message);
      return null;
    }
  };

  // 1) Tenta login com credenciais primárias
  let token = await tryLogin(primaryEmail, primaryPassword);
  if (token) return token;

  // 2) Tenta login com usuário de desenvolvimento, caso já exista
  token = await tryLogin(devEmail, devPassword);
  if (token) return token;

  // 3) Tenta registrar usuário de desenvolvimento; se já existir, prossegue
  try {
    await postJson('/auth/register', { name: 'Dev Áçéntoš', email: devEmail, password: devPassword });
  } catch (regErr) {
    console.warn('Registro do usuário de teste falhou (possivelmente já existe). Prosseguindo com login...', regErr.message);
  }

  // 4) Tenta login novamente com o usuário de desenvolvimento
  token = await tryLogin(devEmail, devPassword);
  if (token) return token;

  throw new Error('Falha de autenticação: não foi possível obter token');
}

async function createAccentAccount(token) {
  const body = {
    name: 'Conta São João – Poupança Ç',
    bank: 'Banco Árvore',
    type: 'corrente',
    balance: 1000.55,
    currency: 'BRL',
  };
  const acc = await postJson('/accounts', body, token);
  return acc?.id || acc?.data?.id || acc?.account?.id || acc?.account_id || acc?.id;
}

async function createAccentExpense(token, accountId) {
  const today = new Date();
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dateStr = fmt(today);
  const body = {
    type: 'conta',
    account_id: accountId,
    description: 'Despesa de maçã – coração & São Paulo',
    value: 123.45,
    due_date: dateStr,
    category: 'Alimentação Ç',
    status: 'paga',
    paid_at: dateStr,
  };
  const exp = await postJson('/expenses', body, token);
  return exp?.id || exp?.data?.id || exp?.expense?.id || exp?.expense_id || exp?.id;
}

async function testExports(token, accountId) {
  const { start, end } = currentMonthRange();

  // Extrato por conta
  const stmt = await getCsv(`/export/statement?accountId=${accountId}&startDate=${start}&endDate=${end}`, token);
  console.log('Statement Content-Type:', stmt.contentType);
  console.log('Statement BOM bytes:', stmt.bomBytes, 'BOM char:', stmt.bomChar);
  const stmtSample = stmt.text.slice(0, 200).replace(/\n/g, '\\n');
  console.log('Statement sample:', stmtSample);
  if (!stmt.contentType.toLowerCase().includes('text/csv')) throw new Error('Statement: Content-Type não é text/csv');
  if (!stmt.contentType.toLowerCase().includes('charset=utf-8')) throw new Error('Statement: charset não é UTF-8');
  if (!stmt.bomBytes) throw new Error('Statement: CSV não inicia com BOM');
  if (!stmt.text.includes('maçã') || !stmt.text.includes('São Paulo')) throw new Error('Statement: conteúdo não contém acentos esperados');

  // Exportação de despesas
  const expCsv = await getCsv(`/export/expenses?startDate=${start}&endDate=${end}&accountId=${accountId}`, token);
  console.log('Expenses Content-Type:', expCsv.contentType);
  console.log('Expenses BOM bytes:', expCsv.bomBytes, 'BOM char:', expCsv.bomChar);
  const expSample = expCsv.text.slice(0, 200).replace(/\n/g, '\\n');
  console.log('Expenses sample:', expSample);
  if (!expCsv.contentType.toLowerCase().includes('text/csv')) throw new Error('Expenses: Content-Type não é text/csv');
  if (!expCsv.contentType.toLowerCase().includes('charset=utf-8')) throw new Error('Expenses: charset não é UTF-8');
  if (!expCsv.bomBytes) throw new Error('Expenses: CSV não inicia com BOM');
  if (!expCsv.text.includes('Alimentação Ç') || !expCsv.text.includes('maçã')) throw new Error('Expenses: conteúdo não contém acentos esperados');

  console.log('Validações concluídas com sucesso: BOM e UTF-8 corretos, acentos presentes.');
}

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  const token = await ensureAuth();
  if (!token) throw new Error('Token não obtido');
  console.log('Token OK');

  const accountId = await createAccentAccount(token);
  if (!accountId) throw new Error('Falha ao criar/obter conta');
  console.log('Conta criada:', accountId);

  const expenseId = await createAccentExpense(token, accountId);
  console.log('Despesa criada:', expenseId);

  await testExports(token, accountId);
}

main().catch((e) => {
  console.error('Erro no teste de exportação CSV:', e);
  process.exit(1);
});
// Testa o endpoint /dashboard e imprime o quadro "recentes"
// Uso: BASE_URL=http://localhost:3003 node scripts/test_recentes.js

const baseUrl = process.env.BASE_URL || 'http://localhost:3003';

async function postJson(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data;
  try { data = await res.json(); } catch (e) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data)}`);
  return data;
}

async function getJson(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  let data;
  try { data = await res.json(); } catch (e) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  const email = process.env.TEST_EMAIL || 'user@example.com';
  const password = process.env.TEST_PASSWORD || 'password';

  // Login (ou cria dev e loga)
  let login;
  try {
    login = await postJson('/auth/login', { email, password });
    console.log('Login OK');
  } catch (e) {
    console.warn('Login falhou, tentando registrar ou logar dev...');
    const devEmail = 'dev@example.com';
    const devPassword = 'StrongP@ssw0rd!';
    try {
      await postJson('/auth/register', { name: 'Dev', email: devEmail, password: devPassword });
      console.log('Usuário dev registrado');
    } catch (eReg) {
      // Se já cadastrado, seguimos para login
      if (!String(eReg.message).includes('E-mail já cadastrado')) {
        console.warn('Registro dev falhou:', eReg.message);
      }
    }
    try {
      login = await postJson('/auth/login', { email: devEmail, password: devPassword });
      console.log('Login como dev OK');
    } catch (eLoginDev) {
      console.error('Login dev falhou:', eLoginDev.message);
      process.exit(1);
    }
  }

  const token = login?.token || login?.data?.token;
  if (!token) {
    console.error('Sem token na resposta de login:', JSON.stringify(login));
    process.exit(1);
  }

  const dash = await getJson('/dashboard', token);
  const recentes = dash?.recentes ?? dash?.data?.recentes ?? [];
  console.log(`Recentes (${Array.isArray(recentes) ? recentes.length : 0} itens):`);
  if (Array.isArray(recentes)) {
    recentes.forEach((item, idx) => {
      const dt = item?.data;
      console.log(`[${idx}] tipo=${item?.tipo} valor=${item?.valor} data=${dt} desc=${item?.descricao}`);
    });
  }
}

main().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
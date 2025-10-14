// Simple Node script to test auth and dashboard endpoints
// Usage: BASE_URL=http://localhost:3001 node scripts/test_auth_and_dashboard.js

const baseUrl = process.env.BASE_URL || 'http://localhost:3001';

async function postJson(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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

async function main() {
  console.log(`Base URL: ${baseUrl}`);
  const email = process.env.TEST_EMAIL || 'user@example.com';
  const password = process.env.TEST_PASSWORD || 'password';

  // Try login
  let login;
  try {
    login = await postJson('/auth/login', { email, password });
    console.log('Login OK');
  } catch (e) {
    console.error('Login failed:', e.message);
    // Optionally try to register a dev user and login
    const devEmail = 'dev@example.com';
    const devPassword = 'StrongP@ssw0rd!';
    try {
      await postJson('/auth/register', { name: 'Dev', email: devEmail, password: devPassword });
      console.log('Registered dev user');
      login = await postJson('/auth/login', { email: devEmail, password: devPassword });
      console.log('Login as dev OK');
    } catch (e2) {
      console.error('Register/Login dev failed:', e2.message);
      process.exit(1);
    }
  }

  const token = login?.token || login?.data?.token;
  if (!token) {
    console.error('No token in login response:', JSON.stringify(login));
    process.exit(1);
  }
  console.log('Token acquired');

  // Fetch dashboard root
  try {
    const dash = await getJson('/dashboard', token);
    // Print concise summary
    const totalBalance = dash?.totalBalance ?? dash?.data?.totalBalance;
    const accounts = dash?.accounts ?? dash?.data?.accounts;
    console.log(`Dashboard OK — totalBalance: ${totalBalance}, accounts: ${Array.isArray(accounts) ? accounts.length : 'n/a'}`);
  } catch (e) {
    console.error('Dashboard failed:', e.message);
    process.exit(1);
  }

  // Fetch monthly summary
  try {
    const summary = await getJson('/dashboard/monthly-summary', token);
    const period = summary?.period ?? summary?.data?.period;
    console.log(`Monthly summary OK — period: ${JSON.stringify(period)}`);
  } catch (e) {
    console.error('Monthly summary failed:', e.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
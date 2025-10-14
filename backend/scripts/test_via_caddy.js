// Test Caddy proxy: login via /api/auth/login and fetch /api/dashboard
// Usage: BASE_URL=http://caddy/api node scripts/test_via_caddy.js

const baseUrl = process.env.BASE_URL || 'http://caddy/api';

async function postJson(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0,400)}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data).slice(0,400)}`);
  }
  return data;
}

async function getJson(path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0,400)}`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${JSON.stringify(data).slice(0,400)}`);
  }
  return data;
}

async function main() {
  console.log(`Caddy Base URL: ${baseUrl}`);
  const email = process.env.TEST_EMAIL || 'dev@example.com';
  const password = process.env.TEST_PASSWORD || 'StrongP@ssw0rd!';

  const login = await postJson('/auth/login', { email, password });
  console.log('Login via Caddy OK, keys:', Object.keys(login));
  const token = login?.token || login?.data?.token;
  if (!token) {
    console.log('Login raw:', JSON.stringify(login).slice(0,500));
    throw new Error('No token found in login response');
  }
  console.log('Token len:', token.length);

  const dash = await getJson('/dashboard', token);
  console.log('Dashboard via Caddy OK. Preview:', JSON.stringify(dash).slice(0,500));

  const summary = await getJson('/dashboard/monthly-summary', token);
  console.log('Monthly summary via Caddy OK. Preview:', JSON.stringify(summary).slice(0,500));
}

main().catch((e) => {
  console.error('Test via Caddy failed:', e.message);
  process.exit(1);
});
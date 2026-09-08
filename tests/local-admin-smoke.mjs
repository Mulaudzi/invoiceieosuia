const baseUrl = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:8000/api';
const email = process.env.SMOKE_ADMIN_EMAIL;
const passwords = [process.env.SMOKE_ADMIN_PASSWORD_1, process.env.SMOKE_ADMIN_PASSWORD_2, process.env.SMOKE_ADMIN_PASSWORD_3];
if (!email || passwords.some((password) => !password)) throw new Error('Set the four SMOKE_ADMIN_* variables.');

let token = '';
const passed = [];
const cleanup = [];

async function raw(path, options = {}, withToken = true) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (withToken && token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const type = response.headers.get('content-type') ?? '';
  const body = type.includes('json') ? await response.json() : await response.arrayBuffer();
  return { response, body };
}

async function request(name, path, options = {}) {
  const { response, body } = await raw(path, options);
  if (!response.ok) throw new Error(`${name}: ${body?.message ?? body?.error ?? `${response.status} ${response.statusText}`}`);
  passed.push(name);
  return body;
}

async function expectStatus(name, status, path, options = {}) {
  const { response } = await raw(path, options, false);
  if (response.status !== status) throw new Error(`${name}: expected ${status}, received ${response.status}`);
  passed.push(name);
}

async function run() {
  await expectStatus('admin users reject missing token', 401, '/guymhan/users');
  await expectStatus('admin dashboard rejects missing token', 401, '/guymhan/dashboard');
  const login = await request('database admin login', '/guymhan/login/batch', {
    method: 'POST', body: JSON.stringify({ email, password_1: passwords[0], password_2: passwords[1], password_3: passwords[2] }),
  });
  token = login.admin_token;

  await request('admin dashboard', '/guymhan/dashboard');
  await request('admin submissions list', '/guymhan/submissions');
  await request('admin email logs', '/guymhan/email-logs');
  await request('admin notification settings', '/guymhan/notification-settings');
  await request('admin email-log export', '/guymhan/export/email-logs');
  await request('admin submission export', '/guymhan/export/submissions');
  await request('admin statistics', '/guymhan/reports/statistics');
  await request('admin activity logs', '/guymhan/activity-logs');
  await request('admin activity export', '/guymhan/export/activity-logs');
  await request('admin sessions', '/guymhan/sessions');
  await request('admin users list', '/guymhan/users');

  const secondary = await request('create secondary admin', '/guymhan/users', {
    method: 'POST', body: JSON.stringify({ name: 'Local QA Secondary Admin', email: 'codex.admin.secondary@ieosuia.com', password_1: 'Secondary-One-2026!', password_2: 'Secondary-Two-2026!', password_3: 'Secondary-Three-2026!' }),
  });
  cleanup.unshift(() => request('delete secondary admin', `/guymhan/users/${secondary.admin_id}`, { method: 'DELETE' }));
  await request('update secondary admin', `/guymhan/users/${secondary.admin_id}`, { method: 'PUT', body: JSON.stringify({ name: 'Local QA Secondary Updated' }) });
  await request('deactivate secondary admin', `/guymhan/users/${secondary.admin_id}/toggle`, { method: 'PATCH' });
  await request('reactivate secondary admin', `/guymhan/users/${secondary.admin_id}/toggle`, { method: 'PATCH' });

  const settingKey = 'local_qa_smoke_setting';
  await request('create admin setting', `/settings/${settingKey}`, { method: 'PUT', body: JSON.stringify({ value: { works: true }, category: 'qa', description: 'Temporary local smoke test' }) });
  cleanup.unshift(() => request('delete admin setting', `/settings/${settingKey}`, { method: 'DELETE' }));
  await request('list admin settings', '/settings');
  await request('read admin setting', `/settings?key=${settingKey}`);
  await request('mail settings', '/settings/mail');

  const domain = await request('add blocked domain', '/blocked-domains', { method: 'POST', body: JSON.stringify({ domain: 'local-qa-blocked.example', reason: 'Temporary local smoke test' }) });
  cleanup.unshift(() => request('delete blocked domain', `/blocked-domains/${domain.domain_id}`, { method: 'DELETE' }));
  await request('list blocked domains', '/blocked-domains?search=local-qa-blocked');
  await request('read blocked domain', `/blocked-domains/${domain.domain_id}`);
  await request('update blocked domain', `/blocked-domains/${domain.domain_id}`, { method: 'PUT', body: JSON.stringify({ reason: 'Updated temporary test' }) });
  await request('blocked-domain export', '/blocked-domains/export');
  const publicCheck = await raw('/blocked-domains/check?domain=local-qa-blocked.example', {}, false);
  if (!publicCheck.response.ok) throw new Error(`public blocked-domain check: ${publicCheck.response.status}`);
  passed.push('public blocked-domain check');

  while (cleanup.length) await cleanup.shift()();
  await request('admin logout', '/guymhan/logout', { method: 'POST', body: JSON.stringify({ admin_token: token }) });
  await expectStatus('logged-out token rejected', 401, '/guymhan/dashboard', { headers: { Authorization: `Bearer ${token}` } });
  console.log(JSON.stringify({ ok: true, passed: passed.length, checks: passed }, null, 2));
}

run().catch(async (error) => {
  const cleanupErrors = [];
  while (cleanup.length) {
    try { await cleanup.shift()(); } catch (cleanupError) { cleanupErrors.push(cleanupError.message); }
  }
  console.error(JSON.stringify({ ok: false, error: error.message, passed, cleanupErrors }, null, 2));
  process.exitCode = 1;
});

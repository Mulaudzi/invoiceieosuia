const base = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:8000/api';
const admin = {
  email: process.env.SMOKE_ADMIN_EMAIL,
  password_1: process.env.SMOKE_ADMIN_PASSWORD_1,
  password_2: process.env.SMOKE_ADMIN_PASSWORD_2,
  password_3: process.env.SMOKE_ADMIN_PASSWORD_3,
};
const auditEmail = `contact.audit.${Date.now()}@example.com`;
const passed = [];

async function call(path, { token, expected = 200, ...options } = {}) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const body = await response.json();
  if (response.status !== expected) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${body.message ?? ''}`);
  return body;
}
async function check(name, fn) { const result = await fn(); passed.push(name); return result; }

async function run() {
  const submitted = await check('public contact submission', () => call('/contact', {
    method: 'POST', body: JSON.stringify({ name: 'Contact Workflow Audit', email: auditEmail, purpose: 'support', origin: 'local-audit', message: 'End-to-end contact workflow test.' }),
  }));
  if (!submitted.success) throw new Error('Contact endpoint did not report success');
  const login = await check('admin login', () => call('/guymhan/login/batch', { method: 'POST', body: JSON.stringify(admin) }));
  const list = await check('admin sees submissions', () => call('/guymhan/submissions?per_page=100', { token: login.admin_token }));
  const submission = list.data.find(item => item.email === auditEmail);
  if (!submission) throw new Error('New submission was not visible to admin');
  await check('admin reads submission', () => call(`/guymhan/submissions/${submission.id}`, { token: login.admin_token }));
  await check('admin marks submission read', () => call(`/guymhan/submissions/${submission.id}/read`, { token: login.admin_token, method: 'POST' }));
  await check('admin updates submission', () => call(`/guymhan/submissions/${submission.id}`, { token: login.admin_token, method: 'PUT', body: JSON.stringify({ status: 'responded', notes: 'Automated workflow verified.' }) }));
  await check('admin deletes submission', () => call(`/guymhan/submissions/${submission.id}`, { token: login.admin_token, method: 'DELETE' }));
  await check('admin logout', () => call('/guymhan/logout', { token: login.admin_token, method: 'POST' }));
  console.log(JSON.stringify({ ok: true, passed: passed.length, checks: passed }, null, 2));
}
run().catch(error => { console.error(JSON.stringify({ ok: false, error: error.message, passed }, null, 2)); process.exitCode = 1; });

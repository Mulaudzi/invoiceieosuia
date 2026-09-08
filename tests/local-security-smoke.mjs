const base = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:8000/api';
const primary = { email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD };
const secondary = { email: 'codex.tenant.audit@ieosuia.com', password: 'Tenant-Audit-Local-2026!' };
const passed = [];

async function call(path, { token, expected = 200, ...options } = {}) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const type = response.headers.get('content-type') ?? '';
  const body = type.includes('json') ? await response.json() : await response.arrayBuffer();
  if (response.status !== expected) throw new Error(`${options.method ?? 'GET'} ${path}: expected ${expected}, received ${response.status} (${body?.message ?? 'no message'})`);
  return body;
}

async function check(name, operation) { const result = await operation(); passed.push(name); return result; }

async function login(account) {
  return call('/login', { method: 'POST', body: JSON.stringify(account) });
}

async function run() {
  if (!primary.email || !primary.password) throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD.');
  const first = await check('primary login', () => login(primary));
  let second;
  try {
    second = await call('/register', { expected: 201, method: 'POST', body: JSON.stringify({ name: 'Disposable Tenant Audit', ...secondary }) });
  } catch (error) {
    second = await login(secondary);
  }
  passed.push('secondary tenant available');

  const client = await check('primary creates isolation client', () => call('/clients', { token: first.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Isolation Client', email: 'isolation@example.com' }) }));
  const product = await check('primary creates isolation product', () => call('/products', { token: first.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Isolation Product', price: 50 }) }));
  const template = await check('primary creates isolation template', () => call('/templates', { token: first.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Isolation Template' }) }));
  const invoice = await check('primary creates isolation invoice', () => call('/invoices', { token: first.token, expected: 201, method: 'POST', body: JSON.stringify({ client_id: client.id, template_id: template.id, date: '2026-08-29', due_date: '2026-09-29', items: [{ product_id: product.id, name: product.name, quantity: 1, price: 50, tax_rate: 0 }] }) }));

  await check('secondary cannot read foreign client', () => call(`/clients/${client.id}`, { token: second.token, expected: 404 }));
  await check('secondary cannot update foreign client', () => call(`/clients/${client.id}`, { token: second.token, expected: 404, method: 'PUT', body: JSON.stringify({ name: 'Stolen' }) }));
  await check('secondary cannot delete foreign client', () => call(`/clients/${client.id}`, { token: second.token, expected: 404, method: 'DELETE' }));
  await check('secondary cannot read foreign product', () => call(`/products/${product.id}`, { token: second.token, expected: 404 }));
  await check('secondary cannot read foreign template', () => call(`/templates/${template.id}`, { token: second.token, expected: 404 }));
  await check('secondary cannot read foreign invoice', () => call(`/invoices/${invoice.id}`, { token: second.token, expected: 404 }));
  await check('secondary cannot create invoice for foreign client', () => call('/invoices', { token: second.token, expected: 404, method: 'POST', body: JSON.stringify({ client_id: client.id, date: '2026-08-29', due_date: '2026-09-29', items: [] }) }));

  await check('currency direct conversion', () => call('/currencies/convert', { method: 'POST', body: JSON.stringify({ amount: 100, from: 'ZAR', to: 'USD' }) }));
  await check('currency same-code conversion', () => call('/currencies/convert', { method: 'POST', body: JSON.stringify({ amount: 100, from: 'ZAR', to: 'ZAR' }) }));
  await check('invalid currency conversion rejected', () => call('/currencies/convert', { expected: 422, method: 'POST', body: JSON.stringify({ amount: 100, from: 'AAA', to: 'BBB' }) }));
  await check('authenticated exchange-rate refresh', () => call('/currencies/update-rates', { token: first.token, method: 'POST' }));

  await call(`/invoices/${invoice.id}`, { token: first.token, method: 'DELETE' });
  await call(`/templates/${template.id}`, { token: first.token, method: 'DELETE' });
  await call(`/products/${product.id}`, { token: first.token, method: 'DELETE' });
  await call(`/clients/${client.id}`, { token: first.token, method: 'DELETE' });
  passed.push('primary isolation fixtures cleaned');

  await check('disposable tenant GDPR deletion', () => call('/gdpr/delete', { token: second.token, method: 'DELETE' }));
  await check('deleted tenant token rejected', () => call('/user', { token: second.token, expected: 401 }));
  console.log(JSON.stringify({ ok: true, passed: passed.length, checks: passed }, null, 2));
}

run().catch((error) => { console.error(JSON.stringify({ ok: false, error: error.message, passed }, null, 2)); process.exitCode = 1; });

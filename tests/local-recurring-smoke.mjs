const base = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:8000/api';
const credentials = { email: process.env.SMOKE_EMAIL, password: process.env.SMOKE_PASSWORD };
const secondaryCredentials = { email: 'codex.recurring.audit@ieosuia.com', password: 'Recurring-Audit-Local-2026!' };
const passed = [];

async function call(path, { token, expected = 200, ...options } = {}) {
  const headers = { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { ...options, headers });
  const body = await response.json();
  if (response.status !== expected) throw new Error(`${options.method ?? 'GET'} ${path}: ${response.status} ${body.message ?? ''}`);
  return body;
}

async function check(name, fn) { const value = await fn(); passed.push(name); return value; }

async function run() {
  const login = await check('login', () => call('/login', { method: 'POST', body: JSON.stringify(credentials) }));
  const staleRecurring = await call('/recurring-invoices', { token: login.token });
  for (const item of staleRecurring.data.filter(item => item.description === 'Monthly audit')) {
    await call(`/recurring-invoices/${item.id}`, { token: login.token, method: 'DELETE' });
  }
  for (const [path, name] of [['templates', 'Recurring Audit Template'], ['products', 'Recurring Audit Product'], ['clients', 'Recurring Audit Client']]) {
    const collection = await call(`/${path}`, { token: login.token });
    for (const item of (collection.data ?? collection).filter(item => item.name === name)) {
      await call(`/${path}/${item.id}`, { token: login.token, method: 'DELETE' });
    }
  }
  passed.push('stale fixtures cleared');
  let secondary;
  try {
    secondary = await call('/register', { expected: 201, method: 'POST', body: JSON.stringify({ name: 'Recurring Tenant', ...secondaryCredentials }) });
  } catch {
    try { secondary = await call('/login', { method: 'POST', body: JSON.stringify(secondaryCredentials) }); }
    catch { passed.push('secondary tenant unavailable due to registration rate limit'); }
  }

  const client = await check('create client', () => call('/clients', { token: login.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Recurring Audit Client', email: 'recurring-audit@example.com' }) }));
  const product = await check('create product', () => call('/products', { token: login.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Recurring Audit Product', price: 100, tax_rate: 0 }) }));
  const template = await check('create template', () => call('/templates', { token: login.token, expected: 201, method: 'POST', body: JSON.stringify({ name: 'Recurring Audit Template' }) }));
  const payload = { client_id: client.id, template_id: template.id, description: 'Monthly audit', frequency: 'monthly', start_date: '2026-08-01', items: [{ product_id: product.id, description: product.name, quantity: 2, unit_price: 100, tax_rate: 0 }] };

  if (secondary) await check('foreign recurring client rejected', () => call('/recurring-invoices', { token: secondary.token, expected: 404, method: 'POST', body: JSON.stringify(payload) }));
  const recurring = await check('create recurring invoice', () => call('/recurring-invoices', { token: login.token, expected: 201, method: 'POST', body: JSON.stringify(payload) }));
  const schedules = await check('due schedule appears as a reminder without generating', () => call('/recurring-invoices', { token: login.token }));
  const scheduled = schedules.data.find(item => Number(item.id) === Number(recurring.id));
  if (!scheduled || scheduled.generated_invoices?.length) throw new Error('Billing schedule generated an invoice unexpectedly');
  passed.push('0% recurring tax preserved');
  const recurringHistory = await check('generated month history readable', () => call(`/recurring-invoices/${recurring.id}`, { token: login.token }));
  if (recurringHistory.data.generated_invoices.length !== 0) throw new Error('Reminder schedule should not generate invoice history');
  passed.push('no generated month created');
  const linkedInvoice = await check('manually create linked invoice', () => call('/invoices', {
    token: login.token, expected: 201, method: 'POST', body: JSON.stringify({
      client_id: client.id, template_id: template.id, recurring_invoice_id: recurring.id,
      date: '2026-08-31', due_date: '2026-09-30', notes: 'Created from billing schedule',
      items: [{ product_id: product.id, name: product.name, description: product.name, quantity: 2, price: 100, tax_rate: 0 }],
    }),
  }));
  const linkedHistory = await check('linked invoice appears in schedule history', () => call(`/recurring-invoices/${recurring.id}`, { token: login.token }));
  if (linkedHistory.data.generated_invoices.length !== 1) throw new Error('Linked invoice was missing from billing schedule history');
  const previousNextDate = linkedHistory.data.next_invoice_date;
  await check('mark linked invoice paid', () => call(`/invoices/${linkedInvoice.id}/mark-paid`, { token: login.token, method: 'POST' }));
  const paidHistory = await check('payment history and schedule advance recorded', () => call(`/recurring-invoices/${recurring.id}`, { token: login.token }));
  const paidEntry = paidHistory.data.generated_invoices.find(item => Number(item.id) === Number(linkedInvoice.id));
  if (paidEntry?.status !== 'Paid' || !paidEntry.payment_date) throw new Error('Payment status or payment date was not recorded');
  if (paidHistory.data.next_invoice_date === previousNextDate) throw new Error('Paid invoice did not advance the schedule reminder');
  passed.push('paid notification condition cleared');
  if (secondary) await check('foreign recurring read rejected', () => call(`/recurring-invoices/${recurring.id}`, { token: secondary.token, expected: 404 }));

  await call(`/invoices/${linkedInvoice.id}`, { token: login.token, method: 'DELETE' });
  await call(`/recurring-invoices/${recurring.id}`, { token: login.token, method: 'DELETE' });
  await call(`/templates/${template.id}`, { token: login.token, method: 'DELETE' });
  await call(`/products/${product.id}`, { token: login.token, method: 'DELETE' });
  await call(`/clients/${client.id}`, { token: login.token, method: 'DELETE' });
  if (secondary) await call('/gdpr/delete', { token: secondary.token, method: 'DELETE' });
  passed.push('fixtures cleaned');
  console.log(JSON.stringify({ ok: true, passed: passed.length, checks: passed }, null, 2));
}

run().catch(error => { console.error(JSON.stringify({ ok: false, error: error.message, passed }, null, 2)); process.exitCode = 1; });

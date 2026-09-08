const baseUrl = process.env.SMOKE_API_URL ?? 'http://127.0.0.1:8000/api';
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

if (!email || !password) {
  throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD before running this test.');
}

let token = '';
const passed = [];
const cleanup = [];

async function request(name, path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { Accept: 'application/json', ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}), ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const type = response.headers.get('content-type') ?? '';
  const body = type.includes('json') ? await response.json() : await response.arrayBuffer();
  if (!response.ok) {
    const detail = body?.message ?? body?.error ?? `${response.status} ${response.statusText}`;
    throw new Error(`${name}: ${detail}`);
  }
  passed.push(name);
  return body;
}

async function run() {
  const auth = await request('login', '/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  token = auth.token;
  await request('current user', '/user');
  const verificationResponse = await fetch(`${baseUrl}/resend-verification`, {
    method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const verificationBody = await verificationResponse.json();
  const alreadyVerified = [400, 422].includes(verificationResponse.status)
    && /already verified/i.test(verificationBody.message ?? '');
  const resendRateLimited = verificationResponse.status === 429;
  if (verificationResponse.ok || alreadyVerified || resendRateLimited) {
    passed.push('verification state handled');
  } else {
    throw new Error(`verification state: ${verificationResponse.status} ${verificationResponse.statusText}`);
  }

  const faviconBytes = await (await fetch('http://127.0.0.1:8080/favicon.png')).arrayBuffer();
  const avatarForm = new FormData();
  avatarForm.append('avatar', new Blob([faviconBytes], { type: 'image/png' }), 'local-qa-avatar.png');
  const avatarUpload = await request('upload avatar', '/avatar', { method: 'POST', body: avatarForm });
  await request('render uploaded avatar', avatarUpload.avatar.replace('/api', ''));
  await request('delete avatar', '/avatar', { method: 'DELETE' });
  const logoForm = new FormData();
  logoForm.append('logo', new Blob([faviconBytes], { type: 'image/png' }), 'local-qa-logo.png');
  const logoUpload = await request('upload business logo', '/upload-logo', { method: 'POST', body: logoForm });
  await request('render uploaded business logo', logoUpload.logo_path.replace('/api', ''));
  const updatedProfile = await request('profile and payment defaults update', '/profile', { method: 'PUT', body: JSON.stringify({ business_name: 'IEOSUIA Local QA', phone: '+27 11 555 0199', address: '1 Local QA Street', tax_number: 'QA-VAT-0', registration_number: 'QA-REG-1', website: 'https://qa.ieosuia.test', bank_name: 'Profile Bank', account_name: 'IEOSUIA QA', account_number: '123456', branch_code: '250655', swift_code: 'QAABZAJJ', payment_instructions: 'Use the invoice number.' }) });
  if (updatedProfile.bankName !== 'Profile Bank' || updatedProfile.accountNumber !== '123456') throw new Error('Profile payment defaults were not returned');
  passed.push('profile payment defaults returned');
  const invoiceLogoForm = new FormData();
  invoiceLogoForm.append('logo', new Blob([faviconBytes], { type: 'image/png' }), 'local-invoice-logo.png');
  const invoiceLogo = await request('upload invoice-specific logo', '/upload-invoice-logo', { method: 'POST', body: invoiceLogoForm });
  await request('render invoice-specific logo', invoiceLogo.logo_path.replace('/api', ''));

  const temporaryPassword = `${password}-Temporary`;
  await request('change password', '/password', { method: 'PUT', body: JSON.stringify({ current_password: password, new_password: temporaryPassword }) });
  await request('restore password', '/password', { method: 'PUT', body: JSON.stringify({ current_password: temporaryPassword, new_password: password }) });
  await request('system templates', '/templates/system/all');
  await request('currencies', '/currencies');
  await request('currency rates', '/currencies/rates');

  const client = await request('create client', '/clients', {
    method: 'POST', body: JSON.stringify({ name: 'Local QA Client', email: 'qa.client@example.com', company: 'Local QA' }),
  });
  cleanup.unshift(() => request('delete client', `/clients/${client.id}`, { method: 'DELETE' }));
  await request('list clients', '/clients?search=Local%20QA');
  await request('read client', `/clients/${client.id}`);
  await request('update client', `/clients/${client.id}`, { method: 'PUT', body: JSON.stringify({ phone: '+27110000000' }) });

  const group = await request('create client group', '/client-groups', {
    method: 'POST', body: JSON.stringify({ name: 'Local QA Group', color: '#00a6a6' }),
  });
  cleanup.unshift(() => request('delete client group', `/client-groups/${group.id}`, { method: 'DELETE' }));
  await request('list client groups', '/client-groups');
  await request('assign client group', `/client-groups/${group.id}/assign`, { method: 'POST', body: JSON.stringify({ client_ids: [client.id] }) });
  await request('read client group', `/client-groups/${group.id}`);
  await request('update client group', `/client-groups/${group.id}`, { method: 'PUT', body: JSON.stringify({ description: 'Updated locally' }) });
  await request('remove client group', `/client-groups/${group.id}/remove`, { method: 'POST', body: JSON.stringify({ client_ids: [client.id] }) });

  const product = await request('create product', '/products', {
    method: 'POST', body: JSON.stringify({ name: 'Local QA Service', description: 'Smoke-test item', category: 'QA', price: 125.5, tax_rate: 15 }),
  });
  cleanup.unshift(() => request('delete product', `/products/${product.id}`, { method: 'DELETE' }));
  await request('list products', '/products?search=Local%20QA');
  await request('product categories', '/products/categories');
  await request('read product', `/products/${product.id}`);
  await request('update product', `/products/${product.id}`, { method: 'PUT', body: JSON.stringify({ price: 130 }) });

  const template = await request('create template', '/templates', {
    method: 'POST', body: JSON.stringify({ name: 'Local QA Template', description: 'Temporary smoke-test template', styles: { primaryColor: '#004f7c' } }),
  });
  cleanup.unshift(() => request('delete template', `/templates/${template.id}`, { method: 'DELETE' }));
  await request('list templates', '/templates');
  await request('read template', `/templates/${template.id}`);
  await request('update template', `/templates/${template.id}`, { method: 'PUT', body: JSON.stringify({ description: 'Updated smoke-test template' }) });
  await request('set default template', `/templates/${template.id}/set-default`, { method: 'POST' });

  const invoice = await request('create invoice', '/invoices', {
    method: 'POST',
    body: JSON.stringify({
      client_id: client.id, template_id: template.id, date: '2026-08-29', due_date: '2026-09-28', notes: 'Local smoke test',
      metadata: { business_name: 'Invoice Override Business', invoice_logo_path: invoiceLogo.logo_path, bank_name: 'Override Bank', account_number: '987654', payment_instructions: 'Override payment instructions.' },
      items: [{ product_id: product.id, name: product.name, description: product.description, quantity: 2, price: 130, tax_rate: 15 }],
    }),
  });
  cleanup.unshift(() => request('delete invoice', `/invoices/${invoice.id}`, { method: 'DELETE' }));
  await request('list invoices', '/invoices');
  const readInvoice = await request('read invoice', `/invoices/${invoice.id}`);
  if (readInvoice.metadata.business_name !== 'Invoice Override Business' || readInvoice.metadata.bank_name !== 'Override Bank') throw new Error('Invoice overrides were not preserved');
  passed.push('invoice overrides preserved');
  await request('update invoice', `/invoices/${invoice.id}`, { method: 'PUT', body: JSON.stringify({ notes: 'Updated local smoke test' }) });
  await request('mark invoice paid', `/invoices/${invoice.id}/mark-paid`, { method: 'POST' });
  await request('render invoice PDF', `/invoices/${invoice.id}/pdf`);
  const invoicePdf = await request('download invoice PDF', `/invoices/${invoice.id}/pdf/download`);
  const pdfSource = new TextDecoder('latin1').decode(invoicePdf);
  if (!pdfSource.includes('/Subtype /Image')) throw new Error('Downloaded invoice PDF did not embed its selected logo');
  passed.push('invoice PDF embeds logo');
  await request('delete business logo', '/logo', { method: 'DELETE' });

  const recurring = await request('create recurring invoice', '/recurring-invoices', {
    method: 'POST',
    body: JSON.stringify({ client_id: client.id, template_id: template.id, description: 'Local QA recurring', frequency: 'monthly', start_date: '2026-09-01', items: [{ product_id: product.id, description: product.description, quantity: 1, unit_price: 130 }] }),
  });
  cleanup.unshift(() => request('delete recurring invoice', `/recurring-invoices/${recurring.id}`, { method: 'DELETE' }));
  await request('list recurring invoices', '/recurring-invoices');
  await request('read recurring invoice', `/recurring-invoices/${recurring.id}`);
  await request('update recurring invoice', `/recurring-invoices/${recurring.id}`, { method: 'PUT', body: JSON.stringify({ description: 'Updated local QA recurring' }) });
  await request('pause recurring invoice', `/recurring-invoices/${recurring.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'paused' }) });

  for (const endpoint of ['dashboard', 'monthly-revenue', 'invoice-status', 'top-clients', 'income-expense', 'recent-invoices', 'extended-stats', 'monthly-stats', 'summary']) {
    await request(`report ${endpoint}`, `/reports/${endpoint}`);
  }
  await request('report PDF export', '/reports/export?type=pdf&report=analytics');
  await request('GDPR export', '/gdpr/export');
  await request('forgot-password email', '/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

  while (cleanup.length) await cleanup.shift()();
  await request('logout', '/logout', { method: 'POST' });
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

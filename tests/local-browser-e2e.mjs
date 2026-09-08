import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const app = process.env.E2E_APP_URL ?? 'http://127.0.0.1:8080';
const api = process.env.E2E_API_URL ?? 'http://127.0.0.1:8000/api';
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;
const chrome = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const suffix = Date.now();
const clientName = `Browser QA Client ${suffix}`;
const clientEditedName = `${clientName} Edited`;
const productName = `Browser QA Product ${suffix}`;
const productEditedName = `${productName} Edited`;
const templateName = `Browser QA Template ${suffix}`;
const templateEditedName = `${templateName} Edited`;
const recurringDescription = `Browser QA Recurring ${suffix}`;
const checks = [];
const runtimeErrors = [];

if (!email || !password) throw new Error('Set SMOKE_EMAIL and SMOKE_PASSWORD.');
await fs.mkdir('tests/artifacts', { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem('cookie_consent', 'essential'));

page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.stack ?? error.message}`));
page.on('console', message => {
  if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
});
page.on('requestfailed', request => runtimeErrors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ''}`));
page.on('response', response => {
  if (response.status() >= 500) runtimeErrors.push(`http-${response.status()}: ${response.request().method()} ${response.url()}`);
});

async function check(name, operation) {
  await operation();
  await page.waitForTimeout(150);
  const boundary = page.getByText(/Something went wrong|Application Error|Invalid time value/i);
  if (await boundary.count() && await boundary.first().isVisible()) throw new Error(`Error boundary visible after ${name}`);
  checks.push(name);
}

async function visit(path, expectedText) {
  await page.goto(`${app}${path}`, { waitUntil: 'networkidle' });
  if (expectedText) await page.getByText(expectedText, { exact: false }).first().waitFor({ state: 'visible' });
}

async function downloadFrom(click, expectedPattern, label) {
  const [download] = await Promise.all([page.waitForEvent('download'), click()]);
  if (!expectedPattern.test(download.suggestedFilename())) throw new Error(`${label}: unexpected filename ${download.suggestedFilename()}`);
  const target = `tests/artifacts/${suffix}-${download.suggestedFilename()}`;
  await download.saveAs(target);
  const stat = await fs.stat(target);
  if (stat.size === 0) throw new Error(`${label}: downloaded file was empty`);
  checks.push(`${label} (${stat.size} bytes)`);
}

async function rowMenu(row, action) {
  await row.getByRole('button').last().click();
  await page.getByRole('menuitem', { name: action, exact: true }).click();
}

try {
  for (const [path, text] of [
    ['/', 'Free.'], ['/login', 'Welcome back'], ['/register', 'Create your account'],
    ['/contact', 'Contact'], ['/faq', 'Frequently'], ['/privacy-policy', 'Privacy'],
  ]) await check(`public route ${path}`, () => visit(path, text));

  const acceptCookies = page.getByRole('button', { name: 'Accept All' });
  if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();

  await check('human login', async () => {
    await visit('/login', 'Welcome back');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard(?:$|\?)/, { timeout: 15000 });
    await page.getByText(/Dashboard/i).first().waitFor();
  });

  await check('clear stale browser QA fixtures', async () => {
    await page.evaluate(async () => {
      const api = `${window.location.origin}/api`;
      const token = localStorage.getItem('ieosuia_auth_token');
      const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
      const get = async path => (await fetch(`${api}${path}`, { headers })).json();
      const del = async path => fetch(`${api}${path}`, { method: 'DELETE', headers });
      const invoices = await get('/invoices');
      for (const row of (invoices.data ?? invoices).filter(item => item.notes === 'Interactive browser QA invoice' || item.client?.name?.startsWith('Browser QA Client'))) await del(`/invoices/${row.id}`);
      const products = await get('/products');
      for (const row of (products.data ?? products).filter(item => item.name?.startsWith('Browser QA Product'))) await del(`/products/${row.id}`);
      const clients = await get('/clients');
      for (const row of (clients.data ?? clients).filter(item => item.name?.startsWith('Browser QA Client'))) await del(`/clients/${row.id}`);
    });
  });

  await check('create client through dialog', async () => {
    await visit('/dashboard/clients', 'Clients');
    await page.getByRole('button', { name: 'Add Client' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#name').fill(clientName);
    await dialog.locator('#email').fill(`browser.qa.${suffix}@example.com`);
    await dialog.locator('#company').fill('Browser QA Company');
    await dialog.locator('#phone').fill('+27 11 555 0101');
    await dialog.getByRole('button', { name: 'Add Client', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(clientName, { exact: true }).waitFor();
  });

  await check('search client', async () => {
    await page.getByPlaceholder('Search clients...').fill(clientName);
    await page.getByText(clientName, { exact: true }).waitFor();
    await page.getByPlaceholder('Search clients...').fill('');
  });

  await check('edit client through UI', async () => {
    const card = page.getByText(clientName, { exact: true }).locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    await rowMenu(card, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.locator('#name').fill(clientEditedName);
    await dialog.locator('#company').fill('Browser QA Company Edited');
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(clientEditedName, { exact: true }).waitFor();
  });

  await check('create product through dialog', async () => {
    await visit('/dashboard/products', 'Products');
    await page.getByRole('button', { name: 'Add Product' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#name').fill(productName);
    await dialog.locator('#description').fill('Created by interactive browser QA');
    await dialog.locator('#price').fill('249.50');
    await dialog.locator('#taxRate').fill('15');
    await dialog.locator('#category').fill('Browser QA');
    await dialog.getByRole('button', { name: 'Add Product', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(productName, { exact: true }).waitFor();
  });

  await check('edit product through UI', async () => {
    const row = page.getByText(productName, { exact: true }).locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.locator('#name').fill(productEditedName);
    await dialog.locator('#price').fill('300.25');
    await dialog.locator('#taxRate').fill('12');
    await dialog.getByRole('button', { name: 'Save Changes' }).click();
    await dialog.waitFor({ state: 'hidden' });
    await page.getByText(productEditedName, { exact: true }).waitFor();
  });

  await check('create invoice and verify product autofill', async () => {
    await visit('/dashboard/invoices', 'Invoices');
    await page.getByRole('button', { name: 'New Invoice' }).click();
    const categoryDialog = page.getByRole('dialog');
    await categoryDialog.getByRole('button', { name: /General \/ Standard/ }).click();
    await page.getByRole('button', { name: 'Use Template', exact: true }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: new RegExp(clientEditedName) }).click();
    await dialog.getByRole('combobox').nth(3).click();
    await page.getByRole('option', { name: new RegExp(productEditedName) }).click();

    const itemName = dialog.getByPlaceholder('Item name');
    if (await itemName.inputValue() !== productEditedName) throw new Error('Product name did not autofill');
    const numberInputs = dialog.locator('input[type="number"]');
    if (Number(await numberInputs.nth(1).inputValue()) !== 300.25) throw new Error('Product price did not autofill');
    if (Number(await numberInputs.nth(3).inputValue()) !== 12) throw new Error('Product tax did not autofill');
    await dialog.getByPlaceholder('Additional notes or payment instructions...').fill('Interactive browser QA invoice');
    await dialog.getByRole('button', { name: 'Create Invoice', exact: true }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    await page.getByText(clientEditedName, { exact: false }).first().waitFor();
  });

  await check('edit invoice through UI', async () => {
    const row = page.getByText(clientEditedName, { exact: false }).first().locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('Additional notes or payment instructions...').fill('Interactive browser QA invoice edited');
    await dialog.getByRole('button', { name: 'Update Invoice' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
  });

  await check('download invoice PDF through UI', async () => {
    const row = page.getByText(clientEditedName, { exact: false }).first().locator('xpath=ancestor::tr[1]');
    await downloadFrom(() => rowMenu(row, 'Download PDF'), /\.pdf$/i, 'invoice PDF download');
  });

  await check('mark invoice paid through UI', async () => {
    const row = page.getByText(clientEditedName, { exact: false }).first().locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Mark as Paid');
    await row.getByText('Paid', { exact: true }).waitFor();
  });

  await check('invoice CSV and text exports', async () => {
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await downloadFrom(() => page.getByRole('menuitem', { name: 'Export as CSV' }).click(), /\.csv$/i, 'invoice CSV export');
    await page.getByRole('button', { name: 'Export', exact: true }).click();
    await downloadFrom(() => page.getByRole('menuitem', { name: 'Export as Text Report' }).click(), /\.txt$/i, 'invoice text export');
  });

  await check('create template through UI', async () => {
    await visit('/dashboard/templates', 'Templates');
    await page.getByRole('button', { name: 'Create Template' }).click();
    await page.locator('#name').fill(templateName);
    await page.locator('#description').fill('Browser CRUD template');
    await page.getByRole('button', { name: 'Save Template' }).click();
    await page.getByText(templateName, { exact: true }).waitFor();
  });

  await check('edit template through UI', async () => {
    const card = page.getByText(templateName, { exact: true }).locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    await card.getByRole('button', { name: 'Edit' }).click();
    await page.locator('#name').fill(templateEditedName);
    await page.locator('#description').fill('Browser CRUD template edited');
    await page.getByRole('button', { name: 'Save Template' }).click();
    await page.getByText(templateEditedName, { exact: true }).waitFor();
  });

  await check('create recurring invoice through UI', async () => {
    await visit('/dashboard/recurring', 'Recurring Invoices');
    await page.getByRole('button', { name: 'New Recurring Invoice' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: clientEditedName, exact: true }).click();
    await dialog.getByRole('combobox').nth(1).click();
    await page.getByRole('option', { name: 'Monthly', exact: true }).click();
    await dialog.getByPlaceholder('e.g., Monthly retainer, Hosting services').fill(recurringDescription);
    await dialog.getByRole('combobox').nth(2).click();
    await page.getByRole('option', { name: new RegExp(productEditedName) }).click();
    await dialog.getByRole('button', { name: 'Create Recurring Invoice' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    await page.getByText(recurringDescription, { exact: true }).waitFor();
  });

  await check('edit and pause recurring invoice through UI', async () => {
    let row = page.getByText(recurringDescription, { exact: true }).locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Edit');
    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder('e.g., Monthly retainer, Hosting services').fill(`${recurringDescription} Edited`);
    await dialog.getByRole('button', { name: 'Update Recurring Invoice' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    row = page.getByText(`${recurringDescription} Edited`, { exact: true }).locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Pause');
    await row.getByText('Paused', { exact: true }).waitFor();
  });

  await check('report CSV PDF and text downloads', async () => {
    await visit('/dashboard/reports', 'Reports');
    for (const [action, pattern, label] of [
      ['Export as CSV', /\.csv$/i, 'report CSV export'],
      ['Export as PDF', /\.pdf$/i, 'report PDF export'],
      ['Export as Text Report', /\.txt$/i, 'report text export'],
    ]) {
      await page.getByRole('button', { name: 'Export Report' }).click();
      await downloadFrom(() => page.getByRole('menuitem', { name: action }).click(), pattern, label);
    }
  });

  await check('analytics read', () => visit('/dashboard/analytics', 'Analytics'));

  await check('profile write and restore through UI', async () => {
    await visit('/dashboard/profile', 'Profile');
    const nameInput = page.locator('#name');
    const originalName = (await nameInput.inputValue()).replace(/ Browser QA/g, '');
    await nameInput.fill(`${originalName} Browser QA`);
    await page.locator('#phone').fill('+27 12 345 6789');
    await page.locator('#address').fill('Browser QA address');
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await page.getByText('Profile updated successfully', { exact: true }).first().waitFor();
    await nameInput.fill(originalName);
    await page.getByRole('button', { name: 'Save Profile' }).click();
    await page.getByText('Profile updated successfully', { exact: true }).first().waitFor();
  });

  await check('GDPR JSON download through UI', async () => {
    await visit('/dashboard/settings', 'Settings');
    await downloadFrom(() => page.getByRole('button', { name: 'Export All Data' }).click(), /\.json$/i, 'GDPR JSON export');
  });

  await check('delete invoice through UI', async () => {
    await visit('/dashboard/invoices', 'Invoices');
    const row = page.getByText(clientEditedName, { exact: false }).first().locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Delete');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await page.getByText(clientEditedName, { exact: false }).first().waitFor({ state: 'hidden' });
  });

  await check('delete recurring invoice through UI', async () => {
    await visit('/dashboard/recurring', 'Recurring Invoices');
    const row = page.getByText(`${recurringDescription} Edited`, { exact: true }).locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Delete');
    await page.getByText(`${recurringDescription} Edited`, { exact: true }).waitFor({ state: 'hidden' });
  });

  await check('delete template through UI', async () => {
    await visit('/dashboard/templates', 'Templates');
    const card = page.getByText(templateEditedName, { exact: true }).locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    await rowMenu(card, 'Delete');
    await page.getByText(templateEditedName, { exact: true }).waitFor({ state: 'hidden' });
  });

  await check('delete product through UI', async () => {
    await visit('/dashboard/products', 'Products');
    const row = page.getByText(productEditedName, { exact: true }).locator('xpath=ancestor::tr[1]');
    await rowMenu(row, 'Delete');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await row.waitFor({ state: 'hidden' });
  });

  await check('delete client through UI', async () => {
    await visit('/dashboard/clients', 'Clients');
    const card = page.getByText(clientEditedName, { exact: true }).locator('xpath=ancestor::div[contains(@class,"bg-card")][1]');
    await rowMenu(card, 'Delete');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await card.waitFor({ state: 'hidden' });
  });

  await check('browser refresh preserves session', async () => {
    await page.reload({ waitUntil: 'networkidle' });
    if (page.url().includes('/login')) throw new Error('Session was lost after refresh');
  });

  await page.screenshot({ path: 'tests/artifacts/browser-e2e-final.png', fullPage: true });

  // Cleanup is intentionally API-driven after the human workflow so QA data is not retained.
  const cleanup = await page.evaluate(async ({ clientName, productName }) => {
    const api = `${window.location.origin}/api`;
    const token = localStorage.getItem('ieosuia_auth_token');
    const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
    const get = async path => (await fetch(`${api}${path}`, { headers })).json();
    const del = async path => fetch(`${api}${path}`, { method: 'DELETE', headers });
    const invoices = await get('/invoices');
    for (const invoice of (invoices.data ?? invoices).filter(row => row.client?.name?.startsWith(clientName) || row.notes?.startsWith('Interactive browser QA invoice'))) await del(`/invoices/${invoice.id}`);
    const recurring = await get('/recurring-invoices');
    for (const item of (recurring.data ?? recurring).filter(row => row.description?.startsWith('Browser QA Recurring'))) await del(`/recurring-invoices/${item.id}`);
    const templates = await get('/templates');
    for (const template of (templates.data ?? templates).filter(row => row.name?.startsWith('Browser QA Template'))) await del(`/templates/${template.id}`);
    const products = await get('/products');
    for (const product of (products.data ?? products).filter(row => row.name?.startsWith(productName))) await del(`/products/${product.id}`);
    const clients = await get('/clients');
    for (const client of (clients.data ?? clients).filter(row => row.name?.startsWith(clientName))) await del(`/clients/${client.id}`);
    return true;
  }, { clientName, productName });
  if (cleanup) checks.push('QA fixtures cleaned');

  if (runtimeErrors.length) throw new Error(`Runtime errors captured:\n${runtimeErrors.join('\n')}`);
  console.log(JSON.stringify({ ok: true, checks: checks.length, passed: checks, runtimeErrors }, null, 2));
} catch (error) {
  await page.screenshot({ path: 'tests/artifacts/browser-e2e-failure.png', fullPage: true }).catch(() => {});
  console.error(JSON.stringify({ ok: false, error: error.message, url: page.url(), checks, runtimeErrors }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}

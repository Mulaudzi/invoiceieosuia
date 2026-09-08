import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('production environment file is ignored', async () => {
  const gitignore = await read('.gitignore');
  assert.match(gitignore, /^api\/\.env$/m);
});

test('CORS does not use a wildcard origin', async () => {
  const index = await read('api/index.php');
  assert.doesNotMatch(index, /Access-Control-Allow-Origin:\s*\*/);
  assert.match(index, /CORS_ALLOWED_ORIGINS/);
});

test('billing schedules do not expose automatic invoice generation routes', async () => {
  const index = await read('api/index.php');
  assert.doesNotMatch(index, /recurring-invoices\/\{id\}\/generate|recurring-invoices\/process/);
});

test('invoice communication features are removed while account email remains', async () => {
  const index = await read('api/index.php');
  const app = await read('src/App.tsx');
  const sidebar = await read('src/components/dashboard/DashboardSidebar.tsx');
  const invoices = await read('src/pages/Invoices.tsx');
  assert.doesNotMatch(index, /message-templates|send-sms|email-preview|\/reminders|\/credits|\/notifications/);
  assert.doesNotMatch(app, /EmailTemplates|NotificationHistory|\/dashboard\/reminders|\/dashboard\/notifications/);
  assert.doesNotMatch(sidebar, /Message Templates|Reminders|Notifications/);
  assert.doesNotMatch(invoices, /Send Email|Send SMS|SendEmailDialog|SendSmsDialog/);
  assert.match(index, /forgot-password/);
  assert.match(index, /verify-email/);
});

test('router prioritizes static paths over parameterized paths', async () => {
  const router = await read('api/core/Router.php');
  assert.match(router, /substr_count\(\$a\['path'\], '\{'\)/);
  assert.match(router, /\$aParams <=> \$bParams/);
});

test('email webhooks fail closed', async () => {
  const webhook = await read('api/controllers/WebhookController.php');
  assert.match(webhook, /if \(\$this->webhookSecret === ''\)\s*\{\s*return false;/);
  assert.doesNotMatch(webhook, /Allow if no signature mechanism detected/);
});

test('password reset uses the server minimum of eight characters', async () => {
  const page = await read('src/pages/ResetPassword.tsx');
  assert.match(page, /password\.length < 8/);
  assert.doesNotMatch(page, /at least 6 characters/);
});

test('invoice creation enforces tenant ownership', async () => {
  const invoice = await read('api/controllers/InvoiceController.php');
  assert.match(invoice, /Client not found/);
  assert.match(invoice, /\(int\) \$client\['user_id'\] !== Auth::id\(\)/);
});

test('database credentials have no source-code fallbacks', async () => {
  const database = await read('api/config/Database.php');
  assert.match(database, /Database configuration is incomplete/);
  assert.doesNotMatch(database, /DB_PASSWORD'\] \?\? '[^']/);
  assert.doesNotMatch(database, /DB_USERNAME'\] \?\? '[^']/);
});

test('admin setup has no hard-coded fallback', async () => {
  const auth = await read('api/controllers/AuthController.php');
  assert.doesNotMatch(auth, /ieosuia_admin_setup_2025/);
  assert.match(auth, /hash_equals\(\$setupKey/);
});

test('CAPTCHA and monetization routes are removed', async () => {
  const index = await read('api/index.php');
  const app = await read('src/App.tsx');
  assert.doesNotMatch(index, /recaptcha|payfast|paystack|payment-history|billing\/|subscription/i);
  assert.doesNotMatch(app, /Payment|Billing|Subscription/);
});

test('landing page presents free access', async () => {
  const section = await read('src/components/landing/FreeForeverSection.tsx');
  assert.match(section, />Free\.<\/h2>/);
  assert.match(section, /No tiers, trials, or locked features/);
});

test('admin authentication has no hard-coded credentials or legacy login routes', async () => {
  const controller = await read('api/controllers/AdminController.php');
  const routes = await read('api/index.php');
  assert.doesNotMatch(controller, /I Am God In Human Form|billionaires|Mu1@udz!|7211018830/);
  assert.doesNotMatch(routes, /guymhan\/login\/step[123]/);
  assert.match(routes, /guymhan\/login\/batch/);
});

test('every admin data route requires admin middleware', async () => {
  const routes = await read('api/index.php');
  const protectedLines = routes.split(/\r?\n/).filter((line) =>
    line.includes('$router->') &&
    (line.includes("'/guymhan/") || line.includes("'/settings") || line.includes("'/blocked-domains")) &&
    !line.includes('/guymhan/setup') &&
    !line.includes('/guymhan/check-email') &&
    !line.includes('/guymhan/login/batch') &&
    !line.includes('/guymhan/login/pin') &&
    !line.includes('/guymhan/logout') &&
    !line.includes('/blocked-domains/check')
  );
  assert.ok(protectedLines.length > 0);
  for (const line of protectedLines) {
    assert.match(line, /AdminAuthMiddleware::class/, `Unprotected admin route: ${line.trim()}`);
  }
});

test('administrator access requires a PIN and expires after five minutes of inactivity', async () => {
  const auth = await read('api/controllers/AuthController.php');
  const admin = await read('api/controllers/AdminController.php');
  const routes = await read('api/index.php');
  const login = await read('src/pages/admin/AdminLogin.tsx');
  const layout = await read('src/components/admin/AdminLayout.tsx');
  const settings = await read('src/pages/admin/AdminSettings.tsx');

  assert.match(auth, /password_verify\(\$pin, \(string\) \$session\['pin_hash'\]\)/);
  assert.match(auth, /password_verify\(\$data\['password'\], \$adminUser\['password'\]\)/);
  assert.doesNotMatch(login, /password_[123]|password[123]/);
  assert.match(routes, /guymhan\/login\/pin/);
  assert.match(routes, /guymhan\/pin/);
  assert.match(admin, /last_activity > DATE_SUB\(NOW\(\), INTERVAL 5 MINUTE\)/);
  assert.match(login, /guymhan\/login\/pin/);
  assert.match(layout, /5 \* 60 \* 1000/);
  assert.match(settings, /guymhan\/pin/);
});

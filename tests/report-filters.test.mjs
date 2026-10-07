import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('dashboard, reports and analytics use one date range for every data query', () => {
  const hooks = read('src/hooks/useReports.ts');
  const controller = read('api/controllers/ReportController.php');
  const dashboard = read('src/pages/Dashboard.tsx');
  const reports = read('src/pages/Reports.tsx');
  const analytics = read('src/pages/Analytics.tsx');
  const model = read('api/core/Model.php');

  assert.match(controller, /invoicesForRange/);
  assert.match(controller, /start_date/);
  assert.match(controller, /end_date/);
  assert.match(hooks, /queryKey: \['reports', 'dashboard', range\]/);
  assert.match(dashboard, /Custom Date Range/);
  assert.match(dashboard, /useState\("this_year"\)/);
  assert.match(reports, /Monthly/);
  assert.match(reports, /Quarterly/);
  assert.match(reports, /Array\.from\(\{ length: 12 \}/);
  assert.match(analytics, /useExtendedStats\(dateRange\)/);
  assert.match(analytics, /useMonthlyStats\(dateRange\)/);
  assert.match(analytics, /useInvoiceStatus\(dateRange\)/);
  assert.match(analytics, /useTopClients\(10, dateRange\)/);
  assert.doesNotMatch(analytics, /\+3\.2% improvement|-2\.1% from last month/);
  assert.match(model, /func_num_args\(\) === 2/);
  assert.match(model, /'<=', '>', '>='/);
});

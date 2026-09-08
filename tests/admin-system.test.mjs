import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('system operations console is admin-protected and covers core records', () => {
  const routes = read('api/index.php');
  const controller = read('api/controllers/AdminSystemController.php');
  assert.match(routes, /\/guymhan\/system.*AdminAuthMiddleware/);
  for (const section of ['users','clients','products','invoices','payments','schedules','uploads','errors','events']) {
    assert.match(controller, new RegExp(`'${section}'`));
  }
  assert.doesNotMatch(controller, /SELECT\s+u\.\*/i);
  assert.doesNotMatch(controller, /password.*SELECT/i);
});

test('admin shell uses app-like mobile navigation without a fixed desktop offset', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const sidebar = read('src/components/admin/AdminSidebar.tsx');
  assert.match(layout, /ml-0.*lg:ml-64/);
  assert.match(sidebar, /lg:hidden fixed inset-x-0 bottom-0/);
  assert.match(sidebar, /overflow-x-auto/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('invoice date rendering is guarded from invalid dates', async () => {
  const modal = await read('src/components/invoices/InvoiceModal.tsx');
  assert.match(modal, /formatDateSafe\(form\.watch\('date'\)/);
  assert.doesNotMatch(modal, /format\(form\.watch\('date'\)/);
});

test('recurring billing remains a reminder and never auto-generates invoices', async () => {
  const controller = await read('api/controllers/RecurringInvoiceController.php');
  const index = await read('api/index.php');
  const header = await read('src/components/dashboard/DashboardHeader.tsx');
  assert.match(controller, /\$item\['tax_rate'\] \?\? 0/);
  assert.doesNotMatch(controller, /\$subtotal \* 0\.15/);
  assert.doesNotMatch(index, /recurring-invoices\/\{id\}\/generate|recurring-invoices\/process/);
  assert.match(header, /Billing notifications|Billing is due today|Create invoice/);
});

test('billing schedules, linked invoices, payments, and notifications stay synchronized', async () => {
  const invoices = await read('api/controllers/InvoiceController.php');
  const header = await read('src/components/dashboard/DashboardHeader.tsx');
  const hooks = await read('src/hooks/useInvoices.ts');
  assert.match(invoices, /recurring_invoice_id/);
  assert.match(invoices, /advanceBillingSchedule/);
  assert.match(invoices, /payment_date/);
  assert.match(header, /currentCycleHandled/);
  assert.match(hooks, /queryKey: \['recurring-invoices'\]/);
});

test('open-ended schedules can complete and invoices support partial payment ledgers', async () => {
  const controller = await read('api/controllers/InvoiceController.php');
  const model = await read('api/models/Invoice.php');
  const routes = await read('api/index.php');
  const schedules = await read('src/pages/RecurringInvoices.tsx');
  const invoices = await read('src/pages/Invoices.tsx');
  assert.match(routes, /invoices\/\{id\}\/payments/);
  assert.match(controller, /payment_history/);
  assert.match(controller, /Payment exceeds the outstanding balance/);
  assert.match(model, /Partially Paid/);
  assert.match(schedules, /handleComplete/);
  assert.match(schedules, /!invoice\.end_date/);
  assert.match(invoices, /Record Payment/);
});

test('all payments remain manageable and duplicate invoices require confirmation', async () => {
  const controller = await read('api/controllers/InvoiceController.php');
  const model = await read('api/models/Invoice.php');
  const invoices = await read('src/pages/Invoices.tsx');
  const modal = await read('src/components/invoices/InvoiceModal.tsx');
  const history = await read('src/components/invoices/PaymentHistoryDialog.tsx');
  const details = await read('src/components/invoices/InvoiceDetailsSheet.tsx');
  assert.match(controller, /duplicate_confirmed/);
  assert.match(controller, /possible duplicate invoice/);
  assert.match(modal, /same client, date, and amount/);
  assert.match(modal, /duplicate_confirmed: true/);
  assert.doesNotMatch(invoices, /Review, edit, or void every recorded payment/);
  assert.match(details, /Payment history/);
  assert.match(details, /Preview invoice/);
  assert.match(history, /Edit/);
  assert.match(history, /Void/);
  assert.match(controller, /withLegacyFullPayment/);
  assert.match(controller, /legacy-full-payment/);
  assert.match(model, /legacy-full-payment/);
});

test('dashboard exposes the exact overdue balance', async () => {
  const reports = await read('api/controllers/ReportController.php');
  const dashboard = await read('src/pages/Dashboard.tsx');
  assert.match(reports, /'overdue_amount' => \$overdue/);
  assert.match(dashboard, /title: "Total Overdue"/);
  assert.match(dashboard, /formatCurrency\(stats\.overdue_amount/);
  assert.match(reports, /'Partially Paid', 'Overdue'/);
  assert.match(dashboard, /status=outstanding/);
  assert.match(dashboard, /status=overdue/);
});

test('new document flow and linked invoice documents preserve document semantics', async () => {
  const dashboard = await read('src/pages/Dashboard.tsx');
  const invoices = await read('src/pages/Invoices.tsx');
  const wizard = await read('src/components/invoices/InvoiceStartWizard.tsx');
  const architecture = await read('src/lib/invoiceArchitecture.ts');
  const modal = await read('src/components/invoices/InvoiceModal.tsx');
  const preview = await read('src/components/invoices/InvoiceDocument.tsx');
  const controller = await read('api/controllers/InvoiceController.php');
  const model = await read('api/models/Invoice.php');
  const pdf = await read('api/controllers/PdfController.php');
  assert.match(dashboard, /New \/ Document/);
  assert.match(dashboard, /invoices\?new=document/);
  assert.match(wizard, /What are you creating\?/);
  assert.match(wizard, /Choose a Design/);
  assert.match(wizard, /What is it for\?/);
  assert.match(wizard, /availableCategories/);
  assert.match(wizard, /documentPrefixes/);
  assert.match(wizard, /categoryExamples/);
  assert.match(wizard, /data=\{previewData\}/);
  assert.match(wizard, /selectedCategory\.name/);
  for (const label of ['Standard Invoice','Tax Invoice','Pro Forma Invoice','Final Invoice','Quote \/ Estimate','Credit Note','Debit Note','Receipt']) assert.match(architecture, new RegExp(label));
  assert.match(invoices, /DropdownMenuSubTrigger/);
  assert.match(invoices, />Documents</);
  assert.match(invoices, /handleCreateDocument\(invoice, 'credit_note'\)/);
  assert.match(invoices, /handleCreateDocument\(invoice, 'debit_note'\)/);
  assert.match(invoices, /handleCreateDocument\(invoice, 'receipt'\)/);
  assert.match(modal, /original_invoice_id/);
  assert.match(controller, /original_invoice_number/);
  assert.match(controller, /generateDocumentNumber/);
  assert.match(model, /'credit_note' => 'CN'/);
  assert.match(model, /'debit_note' => 'DN'/);
  assert.match(model, /'receipt' => 'REC'/);
  assert.doesNotMatch(model, /'receipt' => 'RCT'/);
  assert.match(model, /document_type = \?/);
  assert.match(model, /str_pad\(\(string\) \$highest, 4/);
  assert.match(modal, /documentType==='receipt'\?'REC'/);
  assert.match(preview, /Total Credit/);
  assert.match(preview, /Amount Received/);
  assert.match(pdf, /Total Debit/);
  assert.match(pdf, /Original Invoice/);
});

test('invoice exports preserve displayed document numbers and filters support type and status selections', async () => {
  const invoices = await read('src/pages/Invoices.tsx');
  const exports = await read('src/lib/exportUtils.ts');
  assert.match(exports, /key: 'invoiceNumber', label: 'Document Number'/);
  assert.doesNotMatch(exports, /key: 'id', label: 'Invoice #'/);
  assert.match(invoices, /invoiceNumber: inv\.invoiceNumber/);
  assert.match(invoices, /filteredInvoices\.map/);
  for (const label of ['Standard Invoice', 'Tax Invoice', 'Pro Forma Invoice', 'Final Invoice', 'Quote \/ Estimate', 'Credit Note', 'Debit Note', 'Receipt']) assert.match(invoices, new RegExp(label));
  for (const label of ['Draft', 'Unpaid \/ Pending', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled \/ Voided']) assert.match(invoices, new RegExp(label));
  assert.match(invoices, /selectedDocumentTypes\.includes/);
  assert.match(invoices, /selectedStatuses\.includes/);
});

test('linked credit and debit notes recalculate invoice and client balances', async () => {
  const model = await read('api/models/Invoice.php');
  const controller = await read('api/controllers/InvoiceController.php');
  const clientModel = await read('api/models/Client.php');
  const clients = await read('src/pages/Clients.tsx');
  const details = await read('src/components/invoices/InvoiceDetailsSheet.tsx');
  const pdf = await read('api/controllers/PdfController.php');
  assert.match(model, /linkedAdjustments/);
  assert.match(model, /debit_total.*credit_total/);
  assert.match(model, /linked_documents/);
  assert.match(controller, /credit amount cannot be greater than the remaining adjusted invoice total/i);
  assert.match(controller, /effectiveTotal/);
  assert.match(clientModel, /outstanding_balance/);
  assert.match(clientModel, /original_invoice_number/);
  assert.match(clients, /Documents \/ Transaction History/);
  assert.match(clients, /Overall outstanding balance/);
  assert.match(details, /Related Documents \/ Credit &amp; Debit Notes/);
  assert.match(details, /viewRelatedDocument/);
  assert.match(model, /\['Applied', 'Paid'\]/);
  assert.match(details, /Credits applied/);
  assert.match(details, /Debits applied/);
  assert.match(pdf, /Original Total:/);
  assert.match(pdf, /Credits:/);
  assert.match(pdf, /Debits:/);
});

test('dashboard shell is responsive and stale compiled assets recover safely', async () => {
  const sidebar = await read('src/components/dashboard/DashboardSidebar.tsx');
  const header = await read('src/components/dashboard/DashboardHeader.tsx');
  const css = await read('src/index.css');
  const html = await read('index.html');
  const htaccess = await read('public/.htaccess');
  assert.match(sidebar, /data-mobile-open/);
  assert.match(header, /dashboard-menu-toggle/);
  assert.match(css, /\.ml-64 \{ margin-left: 0 !important/);
  assert.match(css, /\[role="dialog"\]/);
  assert.match(css, /\.ml-64 table \{ min-width: 680px/);
  assert.match(html, /ieosuia-asset-recovery/);
  assert.match(htaccess, /no-cache, no-store, must-revalidate/);
  assert.match(htaccess, /REQUEST_URI.*assets/);
});

test('protected uploaded media does not duplicate the API path prefix', async () => {
  const media = await read('src/hooks/usePrivateMediaUrl.ts');
  assert.match(media, /replace\(\/\^\\\/api/);
  assert.match(media, /responseType:'blob'/);
});

test('business logos fit without forced cropping and verification resend reports real state', async () => {
  const crop = await read('src/components/profile/LogoCropDialog.tsx');
  const auth = await read('api/controllers/AuthController.php');
  assert.match(crop, /Math\.min\(width\/image\.naturalWidth,height\/image\.naturalHeight\)/);
  assert.match(crop, /object-contain/);
  assert.match(auth, /already_verified/);
  assert.match(auth, /could not send the verification email/);
});

test('PDF generation loads raw business fields and the landing page has no demo redirect', async () => {
  const pdf = await read('api/controllers/PdfController.php');
  const fpdf = await read('api/lib/FPDF.php');
  const hero = await read('src/components/landing/HeroSection.tsx');
  assert.match(pdf, /User::query\(\)->find\(Auth::id\(\)\)/);
  assert.match(pdf, /tax_number/);
  assert.match(pdf, /logoCandidates/);
  assert.match(pdf, /\? 37 : 35/);
  assert.match(fpdf, /\$this->Header\(\)/);
  assert.doesNotMatch(hero, /Watch Demo|dQw4w9WgXcQ|showDemo/);
});

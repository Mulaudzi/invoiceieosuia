import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const architecture=fs.readFileSync('src/lib/invoiceArchitecture.ts','utf8');
const renderer=fs.readFileSync('src/components/invoices/InvoiceDocument.tsx','utf8');
const pdf=fs.readFileSync('api/controllers/PdfController.php','utf8');
const slugs=['general-corporate-blue','general-teal-modern','general-minimal-monochrome','general-executive-navy-gold','general-blue-wave','general-purple-clean','general-olive-corporate','general-orange-creative','general-red-professional','general-warm-minimal'];

test('all ten General invoice templates are registered and PDF-aware',()=>{
  for(const slug of slugs){
    assert.match(architecture,new RegExp(`['\"]${slug}['\"]`));
    assert.match(pdf,new RegExp(`['\"]${slug}['\"]`));
  }
  assert.match(architecture,/templateCount:10/);
});

test('invoice renderer uses dynamic semantic data rather than reference backgrounds',()=>{
  assert.match(renderer,/data\.items\.map/);
  assert.match(renderer,/<table className="invoice-items">/);
  assert.match(renderer,/data\.business\.name/);
  assert.doesNotMatch(renderer,/general_standard_invoice_template_\d+\.png/);
});

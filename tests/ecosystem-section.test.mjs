import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("invoice homepage exposes the IEOSUIA ecosystem in UI and crawler HTML", () => {
  const page = read("src/pages/Index.tsx");
  const component = read("src/components/landing/EcosystemSection.tsx");
  const html = read("index.html");
  assert.match(page, /<EcosystemSection\s*\/>[\s\S]*<Footer\s*\/>/);
  assert.match(component, /IEOSUIA Invoices[\s\S]*current: true/);
  for (const url of ["https://qr.ieosuia.com/", "https://invoices.ieosuia.com/", "https://sms.ieosuia.com/", "https://pos.ieosuia.com/"]) assert.match(`${component}\n${html}`, new RegExp(url.replaceAll(".", "\\.")));
  assert.match(html, /<!-- IEOSUIA_ECOSYSTEM -->/);
  assert.ok(html.includes('href="https://pos.ieosuia.com/"'));
  assert.equal((component.match(/name: "IEOSUIA POS"/g) || []).length, 1);
  assert.doesNotMatch(component, /href=["']#["']/);
});

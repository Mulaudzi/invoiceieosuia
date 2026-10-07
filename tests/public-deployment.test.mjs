import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const walk = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory()
    ? walk(path.join(directory, entry.name))
    : [path.join(directory, entry.name)]);

test("landing source contains meaningful semantic HTML and complete metadata", () => {
  const html = read("index.html");
  assert.match(html, /<header[\s>]/);
  assert.match(html, /<nav[\s>]/);
  assert.match(html, /<main[\s>]/);
  assert.match(html, /<section[\s>]/);
  assert.match(html, /<article[\s>]/);
  assert.match(html, /<footer[\s>]/);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(html, /rel="canonical" href="https:\/\/invoices\.ieosuia\.com\/"/);
  assert.match(html, /property="og:title"/);
  assert.doesNotMatch(html, /twitter:/i);
  assert.match(html, /"sameAs":\["https:\/\/www\.instagram\.com\/ieosuia_official\/","https:\/\/www\.facebook\.com\/ieosuia\/","https:\/\/www\.tiktok\.com\/@ieosuia"\]/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /Create\. Send\. Track\. Get paid\./);
  assert.match(html, /Accounting — Coming Soon/);
  assert.match(html, /Invoices today\. Accounting next\./);
  assert.match(html, /Create an Invoice Free/);
  assert.doesNotMatch(html, /Free Forever|Start Free Forever|forever free/i);
  assert.match(html, /Explore more from the IEOSUIA ecosystem/);
  assert.match(html, /href="https:\/\/qr\.ieosuia\.com\/"/);
  assert.match(html, /href="https:\/\/sms\.ieosuia\.com\/"/);
  assert.match(html, /IEOSUIA Invoices — Current Product/);
});

test("crawl controls list public pages and exclude private application routes", () => {
  const robots = read("public/robots.txt");
  const sitemap = read("public/sitemap.xml");
  assert.match(robots, /Disallow: \/dashboard/);
  assert.match(robots, /Disallow: \/guymhan/);
  assert.match(robots, /Sitemap: https:\/\/invoices\.ieosuia\.com\/sitemap\.xml/);
  assert.match(sitemap, /https:\/\/invoices\.ieosuia\.com\/privacy-policy/);
  for (const route of ["features", "invoicing", "quotes", "payment-tracking", "client-management", "products-and-services", "reports", "accounting"]) {
    assert.match(robots, new RegExp(`Allow: /${route}`));
    assert.match(sitemap, new RegExp(`https://invoices\\.ieosuia\\.com/${route}`));
  }
  assert.doesNotMatch(sitemap, /dashboard|guymhan|\/api\//i);
  assert.match(read("public/llms.txt"), /Accounting is planned and is not currently available/);
});

test("public source contains no third-party builder provenance and disables source maps", () => {
  const publicFiles = ["index.html", "public/robots.txt", "public/sitemap.xml", "public/site.webmanifest", "public/manifest.json", "public/favicon.svg", "public/ieosuia-invoices-mask-icon-v2.svg"];
  const publicSource = publicFiles.map(read).join("\n");
  assert.doesNotMatch(publicSource, /lovable(?:\.dev)?|gptengineer|bolt\.new|built with/i);
  assert.match(read("vite.config.ts"), /sourcemap:\s*false/);
});

test("public social branding uses only approved IEOSUIA accounts", () => {
  const socialComponent = read("src/components/branding/IEOSUIASocialLinks.tsx");
  const publicSocialSource = [
    socialComponent,
    read("src/components/landing/Footer.tsx"),
    read("src/pages/Contact.tsx"),
    read("src/pages/Support.tsx"),
    read("src/pages/Documentation.tsx"),
    read("index.html"),
  ].join("\n");
  for (const url of [
    "https://www.instagram.com/ieosuia_official/",
    "https://www.facebook.com/ieosuia/",
    "https://www.tiktok.com/@ieosuia",
  ]) assert.match(publicSocialSource, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(publicSocialSource, /youtube\.com|twitter:|x\.com|linkedin\.com|threads\.net|snapchat\.com|pinterest\.com|discord\.(?:com|gg)|t\.me\//i);
  assert.match(socialComponent, /rel="noopener noreferrer"/);
  assert.match(socialComponent, /aria-label={`IEOSUIA on \$\{name\}`}/);
});

test("every public icon path is explicitly IEOSUIA branded and cache-busted", () => {
  const html = read("index.html");
  const manifest = JSON.parse(read("public/site.webmanifest"));
  const legacyManifest = JSON.parse(read("public/manifest.json"));
  assert.match(html, /rel="shortcut icon"[^>]+favicon\.ico\?v=4/);
  assert.match(html, /rel="apple-touch-icon"[^>]+ieosuia-invoices-apple-touch-icon-v4\.png/);
  assert.match(html, /og:image" content="https:\/\/invoices\.ieosuia\.com\/ieosuia-invoices-social-v2\.png/);
  assert.deepEqual(manifest.icons, legacyManifest.icons);
  assert.ok(manifest.icons.every((icon) => icon.src.includes("ieosuia-invoices-") && icon.src.includes("v4")));
  for (const file of [
    "public/favicon.ico",
    "public/favicon.png",
    "public/ieosuia-invoices-favicon-v4.png",
    "public/ieosuia-invoices-favicon-64-v4.png",
    "public/ieosuia-invoices-pwa-192-v3.png",
    "public/ieosuia-invoices-apple-touch-icon-v4.png",
    "public/ieosuia-invoices-social-v2.png",
  ]) assert.ok(fs.statSync(path.join(root, file)).size > 0, `${file} must exist`);
  const ico = fs.readFileSync(path.join(root, "public/favicon.ico"));
  assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
});

test("approved invoice logos are centralized behind the reusable variant component", () => {
  const logoComponent = read("src/components/branding/IEOSUIAInvoicesLogo.tsx");
  assert.match(logoComponent, /standard\s*\|\s*"dark"|IEOSUIAInvoicesLogoVariant/);
  assert.match(logoComponent, /IEOSUIA Invoices Standard\.png/);
  assert.match(logoComponent, /IEOSUIA Invoices Dark\.png/);
  assert.match(logoComponent, /IEOSUIA Invoices Light\.png/);
  assert.match(logoComponent, /IEOSUIA Invoices High Contrast\.png/);
  assert.match(logoComponent, /alt=\{decorative \? "" : "IEOSUIA Invoices"\}/);

  const directLogoImports = walk("src")
    .filter((file) => /\.(tsx|ts)$/.test(file))
    .filter((file) => !file.endsWith("IEOSUIAInvoicesLogo.tsx"))
    .filter((file) => /IEOSUIA Invoices (?:Standard|Dark|Light|High Contrast)\.png/.test(read(file)));
  assert.deepEqual(directLogoImports, []);
});

test("legacy service-worker paths retire stale favicon caches", () => {
  for (const file of ["public/sw.js", "public/service-worker.js"]) {
    const worker = read(file);
    assert.match(worker, /caches\.keys\(\)/);
    assert.match(worker, /caches\.delete/);
    assert.match(worker, /registration\.unregister\(\)/);
  }
});

test("true public routes receive route-specific prerendered HTML", () => {
  const htaccess = read("public/.htaccess");
  const generator = read("scripts/generate-public-route-html.mjs");
  assert.match(htaccess, /privacy-policy\|terms-of-service\|cookie-policy\|popia-compliance/);
  assert.match(htaccess, /\$1\.html \[END\]/);
  assert.match(generator, /Generated.*route-specific public HTML documents/);
  assert.doesNotMatch(generator, /invoice_id|customer_id|payment_id|INV-[0-9]/i);
});

test("SEO landing pages use unique metadata, one H1 and truthful structured data", () => {
  const routes = ["features", "invoicing", "quotes", "payment-tracking", "client-management", "products-and-services", "reports", "accounting"];
  const generator = read("scripts/generate-public-route-html.mjs");
  const titles = [...generator.matchAll(/title:\s*"([^"]+)"/g)].map((match) => match[1]);
  assert.ok(new Set(titles).size >= routes.length, "public route titles should be unique");
  for (const route of routes) {
    assert.match(generator, new RegExp(`slug:\\s*"${route}"`));
  }
  assert.match(generator, /FAQPage/);
  assert.match(generator, /BreadcrumbList/);
  assert.match(generator, /Broader accounting functionality is planned, not currently available/);
  assert.doesNotMatch(generator, /aggregateRating|reviewCount|best|guaranteed/i);
});

test("private PDF responses are authenticated and explicitly excluded from indexing", () => {
  const routes = read("api/index.php");
  const pdf = read("api/controllers/PdfController.php");
  const reports = read("api/controllers/ReportController.php");
  assert.match(routes, /invoices\/\{id\}\/pdf[^\n]+AuthMiddleware::class/);
  assert.match(routes, /reports\/export[^\n]+AuthMiddleware::class/);
  assert.equal((pdf.match(/X-Robots-Tag: noindex, noarchive/g) ?? []).length, 2);
  assert.match(reports, /X-Robots-Tag: noindex, noarchive/);
});

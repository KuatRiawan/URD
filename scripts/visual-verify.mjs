import puppeteer from '../backend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/ui-ux/screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_360', width: 360, height: 800 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'laptop_1366', width: 1366, height: 768 },
  { name: 'desktop_1920', width: 1920, height: 1080 },
];

const ROLES = [
  {
    role: 'ADMIN_SISTEM',
    label: 'Super Admin',
    email: 'admin.sistem@upayariksadaya.com',
    password: 'DevURD2026!',
    routes: ['/app/dashboard', '/app/orders', '/app/clients', '/app/objects', '/app/users', '/app/settings', '/app/audit-log', '/app/notifications']
  },
  {
    role: 'MARKETING',
    label: 'Marketing',
    email: 'marketing@upayariksadaya.com',
    password: 'DevURD2026!',
    routes: ['/app/dashboard', '/app/orders', '/app/clients', '/app/objects', '/app/reminders', '/app/distributions']
  },
  {
    role: 'AHLI_K3',
    label: 'Inspector / Ahli K3',
    email: 'ahlik3.paa@upayariksadaya.com',
    password: 'DevURD2026!',
    routes: ['/app/dashboard', '/app/inspections', '/app/bap', '/app/lhpp', '/app/history']
  },
  {
    role: 'ADMIN_KANTOR',
    label: 'Admin Kantor',
    email: 'admin.kantor@upayariksadaya.com',
    password: 'DevURD2026!',
    routes: ['/app/dashboard', '/app/orders', '/app/scheduling', '/app/bap', '/app/lhpp', '/app/suket', '/app/distributions', '/app/issues']
  },
  {
    role: 'PIMPINAN',
    label: 'Pimpinan / Manager',
    email: 'pimpinan@upayariksadaya.com',
    password: 'DevURD2026!',
    routes: ['/app/dashboard', '/app/orders', '/app/scheduling', '/app/lhpp', '/app/suket', '/app/distributions', '/app/audit-log']
  }
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

async function run() {
  console.log('=== URD DESIGN SYSTEM & RESPONSIVE OVERFLOW AUDIT ===');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Screenshots: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  // Capture public & auth pages in light mode first
  {
    const pubPage = await browser.newPage();
    await pubPage.setViewport({ width: 1440, height: 900 });
    await pubPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    await pubPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'login_desktop_light.png') });
    await pubPage.setViewport({ width: 390, height: 844 });
    await new Promise((r) => setTimeout(r, 300));
    await pubPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'login_mobile_light.png') });

    await pubPage.setViewport({ width: 1440, height: 900 });
    await pubPage.goto(`${BASE_URL}/verifikasi/URD-VERIF-2026-001`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    await pubPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'public_verification_desktop.png') });

    await pubPage.goto(`${BASE_URL}/portal/URD-PORTAL-TOKEN-2026`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    await pubPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'public_client_portal_desktop.png') });

    await pubPage.close();
  }

  const results = [];

  for (const roleConfig of ROLES) {
    console.log(`\n========================================`);
    console.log(`ROLE: ${roleConfig.label} (${roleConfig.email})`);
    console.log(`========================================`);

    const page = await browser.newPage();

    // 1. Login
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

    await page.type('input[type="email"], input[name="email"]', roleConfig.email);
    await page.type('input[type="password"], input[name="password"]', roleConfig.password);
    await page.click('button[type="submit"]');

    try {
      await page.waitForFunction(() => window.location.pathname.startsWith('/app'), { timeout: 10000 });
    } catch {
      // fallback wait
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Verify redirected into /app
    const currentUrl = page.url();
    if (!currentUrl.includes('/app')) {
      console.error(`  [FAIL] Failed to log in as ${roleConfig.label}. Current URL: ${currentUrl}`);
      await page.close();
      continue;
    }
    console.log(`  [OK] Logged in successfully. Current URL: ${currentUrl}`);

    // 2. Test routes
    for (const route of roleConfig.routes) {
      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
        await new Promise((r) => setTimeout(r, 600)); // allow render & animation

        // Check horizontal overflow
        const overflowData = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const overflow = scrollWidth - clientWidth;

          // Find offending elements if overflow > 0
          let offending = [];
          if (overflow > 0) {
            const all = document.querySelectorAll('*');
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth + 1) {
                offending.push({
                  tag: el.tagName.toLowerCase(),
                  id: el.id,
                  className: el.className ? String(el.className).slice(0, 80) : '',
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
                if (offending.length >= 3) break;
              }
            }
          }

          return { scrollWidth, clientWidth, overflow, offending };
        });

        const status = overflowData.overflow === 0 ? 'PASS' : 'FAIL';
        const record = {
          role: roleConfig.role,
          route,
          viewport: vp.name,
          width: vp.width,
          overflow: overflowData.overflow,
          status,
          offending: overflowData.offending
        };
        results.push(record);

        // Take screenshot for key desktop and mobile viewports
        if (vp.name === 'desktop_1920' || vp.name === 'mobile_390') {
          const safeRoute = route.replace(/\//g, '_');
          const filename = `${roleConfig.role.toLowerCase()}${safeRoute}_${vp.name}.png`;
          const filePath = path.join(SCREENSHOT_DIR, filename);
          await page.screenshot({ path: filePath, fullPage: false });
        }

        const sym = status === 'PASS' ? '✓' : '✗';
        console.log(`  ${sym} [${status}] ${route.padEnd(20)} | ${vp.name.padEnd(12)} (w:${vp.width}) | Overflow: ${overflowData.overflow}px`);
        if (status === 'FAIL') {
          console.log(`      Offending:`, JSON.stringify(overflowData.offending));
        }
      }
    }

    // Logout or clear cookies for next role
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.close();
  }

  await browser.close();

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`FINAL RESPONSIVE OVERFLOW AUDIT SUMMARY`);
  console.log(`======================================================`);
  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;

  console.log(`Total Checks : ${totalChecks}`);
  console.log(`Passed       : ${passedChecks}`);
  console.log(`Failed       : ${failedChecks}`);
  console.log(`Gate Status  : ${failedChecks === 0 ? 'PASSED (Zero horizontal overflow across all roles & viewports)' : 'FAILED'}`);

  // Write summary JSON for artifact documentation
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'audit-results.json'),
    JSON.stringify({ totalChecks, passedChecks, failedChecks, results }, null, 2)
  );

  if (failedChecks > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

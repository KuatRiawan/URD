import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.resolve(__dirname, '../../docs/antigravity/final-product-validation/screenshots');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const PASSWORD = 'DevURD2026!';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginUser(page, email, password = PASSWORD) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#login-email', { timeout: 10000 });

  await page.type('#login-email', email, { delay: 15 });
  await page.type('#login-password', password, { delay: 15 });
  await page.click('button[type="submit"]');

  // Wait for URL change away from /login
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
  await delay(1200);
}

async function clearAuth(page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  // Clear cookies
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
}

async function runDemo() {
  console.log('=== PT UPAYA RIKSA DAYA (URD) — LIVE PRODUCT DEMO & SCREENSHOT SUITE ===');
  console.log(`Target Frontend: ${BASE_URL}`);
  console.log(`Screenshots Directory: ${screenshotDir}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900']
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------------------
    // 1. MARKETING DEMO (Desktop 1366x768)
    // -------------------------------------------------------------------------
    console.log('[1/7] Executing Marketing Journey...');
    await page.setViewport({ width: 1366, height: 768 });
    await loginUser(page, 'marketing@upayariksadaya.com');

    // 1a. Marketing Dashboard
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01-marketing-dashboard.png'), fullPage: false });
    console.log('  -> Captured 01-marketing-dashboard.png');

    // 1b. Marketing Clients
    await page.goto(`${BASE_URL}/app/clients`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01b-marketing-clients.png'), fullPage: false });
    console.log('  -> Captured 01b-marketing-clients.png');

    // 1c. Marketing PO Wizard
    await page.goto(`${BASE_URL}/app/orders/new`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '01c-marketing-po-wizard.png'), fullPage: false });
    console.log('  -> Captured 01c-marketing-po-wizard.png');

    await clearAuth(page);

    // -------------------------------------------------------------------------
    // 2. INSPECTOR DEMO (Mobile 390x844 - Touchscreen Simulation)
    // -------------------------------------------------------------------------
    console.log('\n[2/7] Executing Inspector Mobile Journey (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await loginUser(page, 'ahlik3.paa@upayariksadaya.com');

    // 2a. Inspector Assignments
    await page.goto(`${BASE_URL}/app/inspections`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '02-inspector-mobile-assignments.png'), fullPage: false });
    console.log('  -> Captured 02-inspector-mobile-assignments.png');

    // 2b. Inspector Checklist & Inspection Form
    // Coba buka inspeksi pertama jika ada
    const inspectionLink = await page.$('a[href^="/app/inspections/"]');
    if (inspectionLink) {
      await inspectionLink.click();
      await delay(1500);
    } else {
      // Fallback direct URL ke inspeksi yang tersedia
      await page.goto(`${BASE_URL}/app/inspections/9648d0db-7604-4b7d-9125-a9361c353446`, { waitUntil: 'networkidle2' });
      await delay(1500);
    }
    await page.screenshot({ path: path.join(screenshotDir, '02b-inspector-mobile-checklist.png'), fullPage: false });
    console.log('  -> Captured 02b-inspector-mobile-checklist.png');

    await clearAuth(page);

    // -------------------------------------------------------------------------
    // 3. ADMIN KANTOR DEMO (Desktop 1366x768)
    // -------------------------------------------------------------------------
    console.log('\n[3/7] Executing Admin Kantor Journey...');
    await page.setViewport({ width: 1366, height: 768 });
    await loginUser(page, 'admin.kantor@upayariksadaya.com');

    // 3a. Prioritized Work Queue (5 tabs)
    await page.goto(`${BASE_URL}/app/workqueue`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03-admin-workqueue.png'), fullPage: false });
    console.log('  -> Captured 03-admin-workqueue.png');

    // 3b. Distributions & BAST
    await page.goto(`${BASE_URL}/app/distributions`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '03b-admin-distributions.png'), fullPage: false });
    console.log('  -> Captured 03b-admin-distributions.png');

    await clearAuth(page);

    // -------------------------------------------------------------------------
    // 4. PIMPINAN DEMO (Desktop 1366x768 - Strict Read-Only)
    // -------------------------------------------------------------------------
    console.log('\n[4/7] Executing Pimpinan Executive Monitoring Journey...');
    await page.setViewport({ width: 1366, height: 768 });
    await loginUser(page, 'pimpinan@upayariksadaya.com');

    // 4a. Executive KPI Dashboard
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04-pimpinan-executive-pipeline.png'), fullPage: false });
    console.log('  -> Captured 04-pimpinan-executive-pipeline.png');

    // 4b. Orders Monitoring (Read-Only)
    await page.goto(`${BASE_URL}/app/orders`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04b-pimpinan-orders-readonly.png'), fullPage: false });
    console.log('  -> Captured 04b-pimpinan-orders-readonly.png');

    await clearAuth(page);

    // -------------------------------------------------------------------------
    // 5. SUPER ADMIN DEMO (Desktop 1366x768)
    // -------------------------------------------------------------------------
    console.log('\n[5/7] Executing Super Admin Journey...');
    await page.setViewport({ width: 1366, height: 768 });
    await loginUser(page, 'admin.sistem@upayariksadaya.com');

    // 5a. User & Role Management
    await page.goto(`${BASE_URL}/app/users`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05-superadmin-users.png'), fullPage: false });
    console.log('  -> Captured 05-superadmin-users.png');

    // 5b. Audit Logs Trail
    await page.goto(`${BASE_URL}/app/audit-logs`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '05b-superadmin-audit-logs.png'), fullPage: false });
    console.log('  -> Captured 05b-superadmin-audit-logs.png');

    await clearAuth(page);

    // -------------------------------------------------------------------------
    // 6. PUBLIC QR VERIFICATION DEMO (Mobile 390x844)
    // -------------------------------------------------------------------------
    console.log('\n[6/7] Executing Public Verification Journey...');
    await page.setViewport({ width: 390, height: 844, isMobile: true });
    // Gunakan kode verifikasi LHPP resmi yang ada di seed
    await page.goto(`${BASE_URL}/verifikasi/URD-EB76392D05`, { waitUntil: 'networkidle2' });
    await delay(1200);
    await page.screenshot({ path: path.join(screenshotDir, '06-public-qr-verification.png'), fullPage: false });
    console.log('  -> Captured 06-public-qr-verification.png');

    // -------------------------------------------------------------------------
    // 7. RESPONSIVE TABLET LAYOUT (768x1024)
    // -------------------------------------------------------------------------
    console.log('\n[7/7] Executing Tablet Layout Journey (768x1024)...');
    await page.setViewport({ width: 768, height: 1024 });
    await loginUser(page, 'admin.kantor@upayariksadaya.com');
    await page.goto(`${BASE_URL}/app/orders`, { waitUntil: 'networkidle2' });
    await delay(1000);
    await page.screenshot({ path: path.join(screenshotDir, '07-responsive-tablet-layout.png'), fullPage: false });
    console.log('  -> Captured 07-responsive-tablet-layout.png');

    console.log('\n=== ALL 13 SCREENSHOTS SUCCESSFULLY CAPTURED! ===');
  } catch (err) {
    console.error('Live demo failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

runDemo().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});


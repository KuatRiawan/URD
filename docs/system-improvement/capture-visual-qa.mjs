import puppeteer from '../../backend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve('docs/system-improvement/screenshots');

const ROLES = [
  { role: 'ADMIN_SISTEM', email: 'admin.sistem@upayariksadaya.com', password: 'DevURD2026!' },
  { role: 'MARKETING', email: 'marketing@upayariksadaya.com', password: 'DevURD2026!' },
  { role: 'INSPECTOR', email: 'inspector.paa@upayariksadaya.com', password: 'DevURD2026!' },
  { role: 'ADMIN_KANTOR', email: 'admin.kantor@upayariksadaya.com', password: 'DevURD2026!' },
  { role: 'PIMPINAN', email: 'pimpinan@upayariksadaya.com', password: 'DevURD2026!' }
];

const VIEWPORTS = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-360x800', width: 360, height: 800 }
];

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    for (const r of ROLES) {
      console.log(`\n=== Testing Role: ${r.role} (${r.email}) ===`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      
      const pageErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          pageErrors.push(msg.text());
        }
      });
      page.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      // Navigate to login
      await page.setViewport({ width: 1366, height: 768 });
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });

      // Fill login form
      await page.waitForSelector('input[type="email"]');
      await page.type('input[type="email"]', r.email);
      await page.type('input[type="password"]', r.password);
      await page.click('button[type="submit"]');

      // Wait for navigation to dashboard
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const currentUrl = page.url();
      console.log(`Logged in as ${r.role}, URL: ${currentUrl}`);

      // Capture screenshots across viewports for Dashboard
      for (const vp of VIEWPORTS) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        const screenshotPath = path.join(OUTPUT_DIR, `${r.role.toLowerCase()}-dashboard-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Captured: ${path.basename(screenshotPath)} | Horizontal Overflow: ${overflow ? 'YES (FAIL)' : 'NO (PASS)'}`);
      }

      // Check another role-specific primary page
      let targetRoute = '/app/orders';
      if (r.role === 'INSPECTOR') targetRoute = '/app/inspections';
      if (r.role === 'ADMIN_SISTEM') targetRoute = '/app/users';
      if (r.role === 'ADMIN_KANTOR') targetRoute = '/app/bap';

      await page.goto(`${BASE_URL}${targetRoute}`, { waitUntil: 'networkidle0' }).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const routeScreenshotPath = path.join(OUTPUT_DIR, `${r.role.toLowerCase()}-${targetRoute.replace('/app/', '')}-desktop-1366x768.png`);
      await page.screenshot({ path: routeScreenshotPath, fullPage: false });
      console.log(`Captured secondary route: ${path.basename(routeScreenshotPath)}`);

      if (pageErrors.length > 0) {
        console.warn(`Console errors for ${r.role}:`, pageErrors.slice(0, 3));
      } else {
        console.log(`Console clean for ${r.role}: PASS (0 errors)`);
      }

      await page.close();
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Screenshot run failed:', err);
  process.exit(1);
});

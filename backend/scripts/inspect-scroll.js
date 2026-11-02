import puppeteer from 'puppeteer-core';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  await page.type('#login-email', 'ahlik3.paa@upayariksadaya.com');
  await page.type('#login-password', 'DevURD2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await page.evaluate((el) => el.innerText, b);
    if (/mulai pemeriksaan|buka form|isi checklist|lanjutkan/i.test(text)) {
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 2000));

  // Scroll the scrollable container inside modal
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('[role="dialog"] .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = 1200;
    }
  });

  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: '/tmp/mobile-modal-scroll1.png' });
  console.log('Saved /tmp/mobile-modal-scroll1.png');

  // Scroll further down to photos section
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('[role="dialog"] .overflow-y-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  });

  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: '/tmp/mobile-modal-scroll2.png' });
  console.log('Saved /tmp/mobile-modal-scroll2.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


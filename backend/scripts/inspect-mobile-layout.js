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

  // Take screenshot of modal on mobile
  await page.screenshot({ path: '/tmp/mobile-modal.png', fullPage: false });
  console.log('Saved /tmp/mobile-modal.png');

  // Also check bounding box of elements:
  const modalBox = await page.evaluate(() => {
    const m = document.querySelector('[role="dialog"]');
    const panel = m ? m.children[1] : null;
    const nav = document.querySelector('nav[aria-label="Navigasi bawah mobile"]');
    return {
      windowHeight: window.innerHeight,
      windowWidth: window.innerWidth,
      modal: m ? m.getBoundingClientRect() : null,
      panel: panel ? panel.getBoundingClientRect() : null,
      bottomNav: nav ? nav.getBoundingClientRect() : null
    };
  });
  console.log('Modal dimensions:', modalBox);

  // Check where the photo button is located in the viewport:
  const photoButtons = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('[role="dialog"] label, [role="dialog"] button'));
    return labels
      .filter(el => /foto|kamera|nameplate/i.test(el.innerText || el.getAttribute('title') || ''))
      .map(el => {
        const r = el.getBoundingClientRect();
        return {
          text: el.innerText?.trim()?.slice(0, 30) || el.getAttribute('title'),
          tag: el.tagName,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          height: r.height,
          width: r.width
        };
      });
  });
  console.log('Photo buttons in dialog:', photoButtons);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


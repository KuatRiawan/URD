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

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to login...');
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
      console.log('Found open button:', text.trim());
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 2000));
  console.log('Opened inspection. Current URL:', page.url());

  // Listen to navigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      console.log('MAIN FRAME NAVIGATED TO:', frame.url());
    }
  });

  // Track window unloads and removals
  await page.evaluate(() => {
    window.addEventListener('beforeunload', () => console.log('WINDOW BEFOREUNLOAD FIRED'));
    window.addEventListener('unload', () => console.log('WINDOW UNLOAD FIRED'));
  });

  // Find file inputs in dialog
  const fileInputs = await page.$$('[role="dialog"] input[type="file"]');
  console.log(`Found ${fileInputs.length} file inputs in dialog`);

  // Let's test the main photo upload input (the one in StepPhotosFindings, typically the last one)
  const mainPhotoInput = fileInputs[fileInputs.length - 1];
  if (mainPhotoInput) {
    console.log('Uploading test file to main photo input...');
    await mainPhotoInput.uploadFile('/tmp/test-photo.jpg');
    await new Promise((r) => setTimeout(r, 1000));

    console.log('After selecting file, finding submit button...');
    const submitBtn = await page.$('[role="dialog"] button[type="submit"]');
    if (submitBtn) {
      console.log('Clicking submit photo button...');
      await submitBtn.click();
      await new Promise((r) => setTimeout(r, 3000));
      console.log('After submit click:');
      console.log('Current URL:', page.url());
      console.log('Modal still exists?', !!(await page.$('[role="dialog"]')));
    } else {
      console.log('Submit button not found!');
    }
  }

  // Now let's test one inline checklist item photo input
  if (fileInputs.length > 1) {
    const inlineInput = fileInputs[0];
    console.log('Testing inline item photo upload on first checklist item...');
    await inlineInput.uploadFile('/tmp/test-photo.jpg');
    await new Promise((r) => setTimeout(r, 3000));
    console.log('After inline upload:');
    console.log('Current URL:', page.url());
    console.log('Modal still exists?', !!(await page.$('[role="dialog"]')));
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  try {
    puppeteer = require('puppeteer-core');
    console.log('Using puppeteer-core; ensure a Chromium binary is available and set PUPPETEER_EXECUTABLE_PATH if needed.');
  } catch (err) {
    console.error('Neither puppeteer nor puppeteer-core is installed.');
    console.error('Install with: npm install --save-dev puppeteer');
    process.exit(1);
  }
}

(async () => {
  console.log('PWA smoke test starting...');
  let browser = null;
  let page = null;
  const launchArgs = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  };
  // If using puppeteer-core, allow overriding executable path via env var
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchArgs.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (typeof puppeteer.executablePath === 'function') {
      try {
        const p = puppeteer.executablePath();
        if (p) launchArgs.executablePath = p;
      } catch (e) {
        // ignore
      }
    }

    console.log('Launching Chromium with options:', {
      executablePath: launchArgs.executablePath || '(auto)',
      args: launchArgs.args
    });

    try {
      browser = await puppeteer.launch(launchArgs);
      page = await browser.newPage();
      page.on('console', msg => {
        const text = msg.text();
        console.log('PAGE:', text);
      });
  } catch (launchErr) {
    console.error('Failed to launch Chromium.');
    console.error(launchErr && launchErr.message ? launchErr.message : launchErr);
    console.error('If you are running in a headless container, install a system Chromium or use the bundled Chromium from `puppeteer` package.');
    console.error('You can try:');
    console.error('  sudo apt-get update && sudo apt-get install -y chromium-browser');
    console.error('or set PUPPETEER_EXECUTABLE_PATH to a valid Chrome/Chromium binary');
    process.exit(4);
  }

  const url = 'http://127.0.0.1:8000/';
  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for app root
  await page.waitForSelector('#app', { timeout: 10000 });
  console.log('App loaded');

  // Wait for service worker registration (if supported)
  try {
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });
    console.log('Service worker registered:', swRegistered);
  } catch (e) {
    console.log('Service worker check failed:', e.message || e);
  }

  // Detect if config overlay is open; if so, fill form and generate schedule
  const isConfigOpen = await page.evaluate(() => {
    const overlay = document.getElementById('config-overlay');
    return overlay && !overlay.hidden;
  });

  if (isConfigOpen) {
    console.log('Config overlay is open - filling form');
    // Fill sensible test values
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String((now.getMinutes() + 1) % 60).padStart(2, '0');
    const startTime = `${hh}:${mm}`;

    await page.evaluate((startTime) => {
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
      set('start-time', startTime);
      set('total-sessions', 1);
      set('work-duration', 1);
      set('short-break', 1);
      set('long-break', 1);
      set('sessions-before-long', 5);

      // ensure timer style is digital
      document.querySelectorAll('.radio-option').forEach(o => { o.classList.remove('active'); o.setAttribute('aria-checked','false'); });
      const opt = document.querySelector('.radio-option[data-timer-style="digital"]');
      if (opt) { opt.classList.add('active'); opt.setAttribute('aria-checked','true'); }
    }, startTime);

    // Submit the form
    await page.click('#config-form button[type="submit"], #config-form input[type="submit"]', { delay: 50 }).catch(() => {});
    // Some forms use button elements without type=submit; try to submit the form directly
    await page.evaluate(() => {
      const form = document.getElementById('config-form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    // wait a bit for schedule generation
    await page.waitForTimeout(800);
    console.log('Schedule generated');
  } else {
    console.log('Config overlay not open (schedule likely present)');
  }

  // Read initial timer display
  const initialTime = await page.$eval('#timer-display', el => el.textContent.trim());
  console.log('Initial timer display:', initialTime);

  // Click start
  await page.click('#start-btn');
  console.log('Clicked start');

  // Wait 3 seconds
  await page.waitForTimeout(3000);

  // Read timer display again
  const afterTime = await page.$eval('#timer-display', el => el.textContent.trim());
  console.log('Timer after 3s:', afterTime);

  // Validate timer decreased
  if (initialTime === afterTime) {
    console.error('FAIL: Timer did not change after starting.');
    await browser.close();
    process.exit(2);
  }

  // Pause
  await page.click('#pause-btn');
  console.log('Clicked pause');

  // Capture some DOM snapshots
  const sessionBadge = await page.$eval('#session-badge', el => el.textContent.trim());
  const sessionNumber = await page.$eval('#session-number', el => el.textContent.trim());
  console.log('Session badge:', sessionBadge, 'Session number:', sessionNumber);

  // Success
  console.log('PWA smoke test PASSED');
  await browser.close();
  process.exit(0);
})().catch(async (err) => {
  console.error('Test script error:', err);
  try { process.exit(3); } catch (e) { /* ignore */ }
});

const { chromium } = require('playwright');

const VERIFY_PORT = process.env.VERIFY_PORT || '3000';
const VERIFY_HOST = process.env.VERIFY_HOST || 'localhost';
const VERIFY_BASE_URL = process.env.VERIFY_BASE_URL || `http://${VERIFY_HOST}:${VERIFY_PORT}`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to local server
  await page.goto(VERIFY_BASE_URL);

  // Wait for UI to load
  await page.waitForSelector('.window-title');
  await page.waitForSelector('.panel');

  // Take screenshot of the desktop
  await page.screenshot({ path: 'verification/ui_screenshot.png', fullPage: true });

  console.log('Screenshot saved to verification/ui_screenshot.png');
  await browser.close();
})();

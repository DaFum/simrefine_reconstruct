const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to local server
  await page.goto('http://localhost:3000');

  // Wait for UI to load
  await page.waitForSelector('.window-title');
  await page.waitForSelector('.panel');

  // Take screenshot of the desktop
  await page.screenshot({ path: 'verification/ui_screenshot.png', fullPage: true });

  console.log('Screenshot saved to verification/ui_screenshot.png');
  await browser.close();
})();

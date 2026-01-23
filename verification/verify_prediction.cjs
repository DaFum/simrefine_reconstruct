const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Assuming the server is running on port 8080 or similar
  // The environment variable VERIFY_HOST and VERIFY_PORT should be used
  const host = process.env.VERIFY_HOST || 'localhost';
  const port = process.env.VERIFY_PORT || '8080';
  const url = `http://${host}:${port}`;

  console.log(`Navigating to ${url}`);
  try {
    await page.goto(url);
  } catch (e) {
    console.error("Failed to connect to server. Is it running?");
    process.exit(1);
  }

  // Wait for UI to load
  await page.waitForSelector('#crude-input');

  console.log("Simulating slider input...");

  // Simulate changing the crude input
  // We trigger 'input' event which should fire the debounced prediction
  await page.evaluate(() => {
      const slider = document.getElementById('crude-input');
      slider.value = 150;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // Wait for debounce (150ms) + processing time
  await page.waitForTimeout(500);

  // Check for ghost element
  const ghost = await page.$('.metric-ghost');
  if (ghost) {
      console.log("SUCCESS: Prediction ghost element found.");
      const text = await ghost.textContent();
      console.log(`Ghost text: ${text}`);

      // Take screenshot
      await page.screenshot({ path: 'verification/prediction_ghost.png' });
  } else {
      console.error("FAILURE: No prediction ghost element found.");
      await page.screenshot({ path: 'verification/prediction_failed.png' });
      process.exit(1);
  }

  await browser.close();
})();

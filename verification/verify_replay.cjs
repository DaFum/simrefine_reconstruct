const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Listen to console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  const host = process.env.VERIFY_HOST || 'localhost';
  const port = process.env.VERIFY_PORT || '8080';
  const url = `http://${host}:${port}`;

  console.log(`Navigating to ${url}`);
  try {
    await page.goto(url);
  } catch (e) {
    console.error("Failed to connect to server.");
    process.exit(1);
  }

  await page.waitForSelector('#mode-badge');

  console.log("Simulating 'R' keypress (Start Recording)...");
  await page.keyboard.press('R');

  // Wait longer to ensure frames are recorded
  // Default speed 35x. 60 sim mins = ~1.7 sec real time.
  // Let's wait 3 seconds.
  console.log("Waiting for recording...");
  await page.waitForTimeout(3000);

  console.log("Simulating 'R' keypress (Stop Recording)...");
  await page.keyboard.press('R');

  await page.waitForTimeout(500);

  // Now playback
  console.log("Triggering Playback via 'L'...");
  await page.keyboard.press('L');

  // Check for Replay UI
  try {
      await page.waitForSelector('#replay-controls', { state: 'visible', timeout: 3000 });
      console.log("SUCCESS: Replay controls visible.");

      const badgeText = await page.textContent('#mode-badge');
      if (badgeText.includes('REPLAY')) {
          console.log("SUCCESS: Mode badge shows REPLAY.");
      } else {
          console.error(`FAILURE: Mode badge shows '${badgeText}'`);
      }

      await page.screenshot({ path: 'verification/replay_mode.png' });
  } catch (e) {
      console.error("FAILURE: Replay controls not found or visible.");
      await page.screenshot({ path: 'verification/replay_failed.png' });
      process.exit(1);
  }

  await browser.close();
})();

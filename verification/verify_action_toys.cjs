const { chromium } = require('playwright');
const path = require('path');

async function verifyActionToys() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const port = process.env.VERIFY_PORT || 3000;
  const host = process.env.VERIFY_HOST || 'localhost';
  const url = `http://${host}:${port}`;

  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
    await page.waitForSelector('#scene-container canvas');

    // Wait for simulation to initialize
    await page.waitForTimeout(2000);

    // 1. Verify Drone (Inspection)
    console.log('Selecting a unit to inspect...');
    // Click on the map center roughly where a unit might be, or select via DOM if possible?
    // The canvas captures clicks. We can't click DOM elements for 3D objects easily.
    // However, we can use the "UNITS" menu to select one if available?
    // Or just try to click on the screen center.
    // Let's try to click a unit.
    await page.mouse.click(500, 300); // Approximate center
    await page.waitForTimeout(500);

    // Check if context action bar appears or we can use the INSPECT button in main toolbar if unit selected
    // The "INSPECT" button is in `.toolbar-group` probably.
    // Let's look for button with text "INSPECT"
    const inspectBtn = page.locator('button:has-text("INSPECT")');
    if (await inspectBtn.isVisible()) {
        console.log('Clicking INSPECT...');
        await inspectBtn.click();
        await page.waitForTimeout(1000); // Wait for drone to spawn
        await page.screenshot({ path: 'verification/action_toy_drone.png' });
        console.log('Drone screenshot captured.');
    } else {
        console.log('INSPECT button not visible. Unit selection might have failed.');
    }

    // 2. Verify Truck (Convoy / ROAD)
    console.log('Triggering ROAD convoy...');
    const roadBtn = page.locator('button:has-text("ROAD")');
    if (await roadBtn.isVisible()) {
        await roadBtn.click();
        await page.waitForTimeout(2000); // Wait for trucks to appear
        await page.screenshot({ path: 'verification/action_toy_truck.png' });
        console.log('Truck screenshot captured.');
    } else {
        console.log('ROAD button not visible.');
    }

    console.log('Verification finished.');

  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

verifyActionToys();

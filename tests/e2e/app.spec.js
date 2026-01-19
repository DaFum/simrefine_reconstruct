import { test, expect } from '@playwright/test';

test.describe('SimRefinery E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (served by the test runner's web server)
    await page.goto('/');
  });

  test('should load the main UI components', async ({ page }) => {
    // Check for the main navigation bar
    const navBar = page.locator('#menu-bar');
    await expect(navBar).toBeVisible();

    // Check for the 3D canvas container
    const canvasContainer = page.locator('#scene-container');
    await expect(canvasContainer).toBeVisible();

    // Check that the canvas element is actually created (SimRefinery initializes it)
    const canvas = page.locator('#scene-container canvas');
    await expect(canvas).toBeAttached();

    // Verify canvas has dimensions (meaning renderer started)
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('should toggle dropdown menus', async ({ page }) => {
    // Locate the Session menu button
    const sessionMenuBtn = page.locator('.menu[data-menu="session"] .menu-item');

    // Initially the dropdown should be hidden (or not have the visible class)
    // In this app, visibility is controlled by the parent having '.open'
    const sessionMenuParent = page.locator('.menu[data-menu="session"]');
    await expect(sessionMenuParent).not.toHaveClass(/open/);

    // Click to open
    await sessionMenuBtn.click();
    await expect(sessionMenuParent).toHaveClass(/open/);

    // Click again to close
    await sessionMenuBtn.click();
    await expect(sessionMenuParent).not.toHaveClass(/open/);
  });
});

// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForAppToLoad } = require('./test-helpers');

test.describe('Smoke Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Basic smoke test - just verify the app loads
    await expect(page).toHaveTitle(/Rail Baron/i);
    await expect(page.locator('body')).toContainText('Rail Baron');
    
    // Verify main UI elements are present
    await expect(page.locator('#players-section, .players-section, [class*="player"]')).toBeVisible();
    
    console.log('✅ Application loaded successfully');
  });

  test('should be responsive and handle window resize', async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
    
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Application is responsive');
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    const jsErrors = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Interact with basic functionality
    const addPlayerBtn = page.locator('#add-player-btn, button:has-text("Add"), .add-player');
    if (await addPlayerBtn.isVisible()) {
      await addPlayerBtn.click();
    }
    
    const mapSelect = page.locator('#map-select, select');
    if (await mapSelect.isVisible()) {
      await mapSelect.selectOption('GB');
      await mapSelect.selectOption('US');
    }
    
    // Check for any JavaScript errors
    expect(jsErrors).toEqual([]);
    
    console.log('✅ No JavaScript errors detected');
  });
});

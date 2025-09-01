// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForAppToLoad } = require('./test-helpers');

test.describe('Smoke Tests', () => {
  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Basic smoke test - just verify the app loads
    await expect(page).toHaveTitle(/Boxcars Conductor/i);
    await expect(page.locator('body')).toContainText('Boxcars Conductor');
    
    // Verify main UI elements are present
    await expect(page.locator('#players')).toBeVisible();
    await expect(page.locator('#btn-add-player')).toBeVisible();
    
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
    
    // waitForAppToLoad already handles the map dialog, no need to handle it again
    
    // Interact with basic functionality
    const addPlayerBtn = page.locator('#btn-add-player');
    if (await addPlayerBtn.isVisible()) {
      await addPlayerBtn.click();
    }
    
    // Check for any JavaScript errors
    expect(jsErrors).toEqual([]);
    
    console.log('✅ No JavaScript errors detected');
  });
});

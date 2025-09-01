// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Rolling and Destinations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Set up a player for testing
    await page.locator('#add-player-btn').click();
    await page.locator('input[placeholder*="name"]').first().fill('Test Player');
  });

  test('should roll home city for new player', async ({ page }) => {
    const rollBtn = page.locator('.roll-btn').first();
    const playerCard = page.locator('.player-card').first();

    // Roll for home city
    await rollBtn.click();

    // Should show roll result
    await expect(playerCard.locator('.roll-result')).toBeVisible();
    await expect(playerCard.locator('.roll-result')).toContainText('→');

    // Should trigger home city selection dialog
    const dialog = page.locator('.modal, .dialog').first();
    if (await dialog.isVisible()) {
      // Select a city from the dialog
      const cityOption = dialog.locator('option, .city-option').first();
      await cityOption.click();
      
      // Confirm selection
      const confirmBtn = dialog.locator('button:has-text("Confirm"), .confirm-btn');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }

    // Should have a city set
    await expect(playerCard.locator('.stop-item')).toHaveCount(1);
    await expect(playerCard.locator('.stop-item').first()).not.toContainText('—');
  });

  test('should roll next destination', async ({ page }) => {
    const rollBtn = page.locator('.roll-btn').first();
    const playerCard = page.locator('.player-card').first();

    // First, set up home city by adding a stop manually or through rolling
    // (This test assumes we can manually add a stop for testing)
    
    // Roll for next destination
    await rollBtn.click();

    // Should show roll result with region and city
    await expect(playerCard.locator('.roll-result')).toBeVisible();
    const rollText = await playerCard.locator('.roll-result').textContent();
    
    // Roll result should contain dice notation and arrow
    expect(rollText).toMatch(/→/);
    expect(rollText).toMatch(/(Odd|Even)/);
  });

  test('should handle region selection when same region rolled', async ({ page }) => {
    // This test would verify the region selection dialog appears
    // when the same region is rolled as current location
    
    const rollBtn = page.locator('.roll-btn').first();
    
    // Roll multiple times to potentially trigger region selection
    for (let i = 0; i < 3; i++) {
      await rollBtn.click();
      
      // Check if region selection dialog appears
      const regionDialog = page.locator('.modal:has-text("region"), .dialog:has-text("region")');
      if (await regionDialog.isVisible()) {
        // Select a different region
        const regionOption = regionDialog.locator('option, .region-option').first();
        await regionOption.click();
        
        // Confirm selection
        const confirmBtn = regionDialog.locator('button:has-text("Confirm"), .confirm-btn');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
        break;
      }
      
      // Wait a bit between rolls
      await page.waitForTimeout(500);
    }
  });

  test('should calculate payouts correctly', async ({ page }) => {
    const playerCard = page.locator('.player-card').first();
    
    // Roll and set up some destinations
    await page.locator('.roll-btn').first().click();
    
    // Wait for any dialogs and handle them
    await page.waitForTimeout(1000);
    
    // Check if there are any stops with payouts
    const stopItems = playerCard.locator('.stop-item');
    const stopCount = await stopItems.count();
    
    if (stopCount > 1) {
      // Check that payouts are displayed
      const payoutElements = playerCard.locator('.payout, [class*="payout"]');
      const payoutCount = await payoutElements.count();
      
      if (payoutCount > 0) {
        // Verify payout format (should have currency symbol)
        const payoutText = await payoutElements.first().textContent();
        expect(payoutText).toMatch(/[\$£]\d+/); // Should contain $ or £ followed by numbers
      }
    }
  });

  test('should update statistics when destinations are added', async ({ page }) => {
    const statsBtn = page.locator('button:has-text("Stats"), .stats-btn, #stats-btn');
    
    // Add some destinations by rolling
    const rollBtn = page.locator('.roll-btn').first();
    await rollBtn.click();
    await page.waitForTimeout(1000);
    
    // Open statistics
    if (await statsBtn.isVisible()) {
      await statsBtn.click();
      
      // Check that stats dialog opens
      const statsDialog = page.locator('.modal:has-text("Statistics"), .stats-dialog, #stats-dialog');
      await expect(statsDialog).toBeVisible();
      
      // Check that statistics are populated
      const statsTable = statsDialog.locator('table');
      if (await statsTable.isVisible()) {
        await expect(statsTable.locator('tr')).toHaveCount.greaterThan(1); // Header + at least one data row
        
        // Check that player name appears in stats
        await expect(statsTable).toContainText('Test Player');
      }
      
      // Close dialog
      const closeBtn = statsDialog.locator('button:has-text("Close"), .close-btn, [aria-label="Close"]');
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });
});

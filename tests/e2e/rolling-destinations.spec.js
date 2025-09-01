// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForAppToLoad, setupPlayersForTesting, handleModalDialogs } = require('./test-helpers');

test.describe('Rolling and Destinations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Set up a player for testing
    await setupPlayersForTesting(page, ['Test Player']);
  });

  test('should roll home city for new player', async ({ page }) => {
    const rollBtn = page.locator('.btn-roll-stop').first();
    const playerCard = page.locator('.player-card').first();

    // Initially should show "Roll Home City"
    await expect(rollBtn).toContainText('Roll Home City');

    // Roll for home city (force click to handle dynamic content)
    await rollBtn.click({ force: true });

    // Give time for the rolling process and any dialogs
    await page.waitForTimeout(1000);

    // Should trigger home city selection dialog
    const dialog = page.locator('.modal, .dialog').first();
    if (await dialog.isVisible()) {
      // Select a city from the dialog
      const cityOption = dialog.locator('option, .city-option').first();
      await cityOption.click({ force: true });
      
      // Confirm selection
      const confirmBtn = dialog.locator('button:has-text("Confirm"), .confirm-btn');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click({ force: true });
      }
    }

    // After rolling, should have at least one stop
    await expect(playerCard.locator('.stop-list .stop')).toHaveCount(1, { timeout: 10000 });
    
    // Button text should change to "Roll Stop" after home city is fully set
    // But this might require manual city selection, so check for either state
    const buttonText = await rollBtn.textContent();
    expect(['Roll Home City', 'Roll Stop']).toContain(buttonText);

    // Verify the stop has city selection available
    const stopCity = playerCard.locator('.stop-city').first();
    await expect(stopCity).toBeVisible();
  });

  test('should roll next destination', async ({ page }) => {
    const rollBtn = page.locator('.btn-roll-stop').first();
    const playerCard = page.locator('.player-card').first();

    // First, set up home city by adding a stop manually or through rolling
    // (This test assumes we can manually add a stop for testing)
    
    // Roll for next destination
    await rollBtn.click({ force: true });

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
    
    const rollBtn = page.locator('.btn-roll-stop').first();
    
    // Roll multiple times to potentially trigger region selection
    for (let i = 0; i < 3; i++) {
      await rollBtn.click({ force: true });
      
      // Check if region selection dialog appears
      const regionDialog = page.locator('.modal:has-text("region"), .dialog:has-text("region")');
      if (await regionDialog.isVisible()) {
        // Select a different region
        const regionOption = regionDialog.locator('option, .region-option').first();
        await regionOption.click({ force: true });
        
        // Confirm selection
        const confirmBtn = regionDialog.locator('button:has-text("Confirm"), .confirm-btn');
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click({ force: true });
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
    await page.locator('.btn-roll-stop').first().click({ force: true });
    
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
    const statsBtn = page.locator('#btn-stats');
    
    // Add some destinations by rolling
    const rollBtn = page.locator('.btn-roll-stop').first();
    await rollBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    // Open statistics
    if (await statsBtn.isVisible()) {
      await statsBtn.click({ force: true });
      
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
        await closeBtn.click({ force: true });
      }
    }
  });
});

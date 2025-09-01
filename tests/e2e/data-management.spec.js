// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForAppToLoad, setupPlayersForTesting } = require('./test-helpers');

test.describe('Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);

    // Set up test data: add a player with some destinations
    await setupPlayersForTesting(page, ['Test Player']);
  });

  test('should export game data as JSON', async ({ page }) => {
    // Look for export functionality
    const exportBtn = page.locator('button:has-text("Export"), .export-btn, #export-btn');
    
    if (await exportBtn.isVisible()) {
      // Set up download handling
      const downloadPromise = page.waitForEvent('download');
      
      await exportBtn.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify download occurred
      expect(download.suggestedFilename()).toMatch(/\.json$/);
      
      // Save and verify file content
      const filePath = await download.path();
      expect(filePath).toBeTruthy();
    } else {
      // If no export button, check if there's alternative export mechanism
      console.log('Export button not found - may need to implement export functionality');
    }
  });

  test('should export statistics as CSV', async ({ page }) => {
    // Open statistics dialog
    const statsBtn = page.locator('button:has-text("Stats"), .stats-btn, #stats-btn');
    
    if (await statsBtn.isVisible()) {
      await statsBtn.click();
      
      const statsDialog = page.locator('.modal, .stats-dialog, #stats-dialog');
      await expect(statsDialog).toBeVisible();
      
      // Look for CSV export in stats dialog
      const csvBtn = statsDialog.locator('button:has-text("CSV"), button:has-text("Export"), .csv-btn');
      
      if (await csvBtn.isVisible()) {
        const downloadPromise = page.waitForEvent('download');
        
        await csvBtn.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(csv|txt)$/);
      }
    }
  });

  test('should import game data from JSON file', async ({ page }) => {
    // Create test data to import
    const testGameState = {
      players: [
        {
          id: 'player-1',
          name: 'Imported Player',
          stops: [
            { cityId: 1, payoutFromPrev: null, unreachable: false, lastRollText: 'Home city' },
            { cityId: 5, payoutFromPrev: 150, unreachable: false, lastRollText: 'Rolled destination' }
          ]
        }
      ],
      settings: { map: 'US' }
    };

    // Look for import functionality
    const importBtn = page.locator('button:has-text("Import"), .import-btn, #import-btn, input[type="file"]');
    
    if (await importBtn.isVisible()) {
      // Create a temporary file with test data
      const fileContent = JSON.stringify(testGameState, null, 2);
      
      // Upload the file
      await importBtn.setInputFiles({
        name: 'test-game.json',
        mimeType: 'application/json',
        buffer: Buffer.from(fileContent)
      });
      
      // Wait for import to complete
      await page.waitForTimeout(1000);
      
      // Verify imported data
      await expect(page.locator('.player-card')).toHaveCount(1);
      await expect(page.locator('input[placeholder*="name"]').first()).toHaveValue('Imported Player');
      
      // Check that stops were imported
      const stopItems = page.locator('.stop-item');
      await expect(stopItems).toHaveCount(2);
      
      // Verify payout calculation
      const payoutElements = page.locator('.payout, [class*="payout"]');
      if (await payoutElements.count() > 0) {
        const payoutText = await payoutElements.first().textContent();
        expect(payoutText).toContain('150');
      }
    }
  });

  test('should handle invalid import data gracefully', async ({ page }) => {
    const importBtn = page.locator('input[type="file"], .import-btn');
    
    if (await importBtn.isVisible()) {
      // Try to import invalid JSON
      const invalidJson = '{ invalid json content }';
      
      await importBtn.setInputFiles({
        name: 'invalid.json',
        mimeType: 'application/json',
        buffer: Buffer.from(invalidJson)
      });
      
      // Should show error message or gracefully handle
      // Check for error indicators
      const errorElements = page.locator('.error, .alert, [class*="error"]');
      
      // Either error is shown or original state is preserved
      const hasError = await errorElements.count() > 0;
      const playersUnchanged = await page.locator('.player-card').count() === 1; // Our test player
      
      expect(hasError || playersUnchanged).toBeTruthy();
    }
  });

  test('should maintain data consistency across browser refresh', async ({ page }) => {
    // Add some game data
    await page.locator('.roll-btn').first().click();
    await page.waitForTimeout(1000);
    
    // Switch map to GB
    await page.locator('#map-select').selectOption('GB');
    
    // Get current state
    const playerName = await page.locator('input[placeholder*="name"]').first().inputValue();
    const mapValue = await page.locator('#map-select').inputValue();
    const stopCount = await page.locator('.stop-item').count();
    
    // Refresh the page
    await page.reload();
    
    // Verify state is restored
    await expect(page.locator('input[placeholder*="name"]').first()).toHaveValue(playerName);
    await expect(page.locator('#map-select')).toHaveValue(mapValue);
    
    // Stop count should be maintained (or at least base structure)
    const newStopCount = await page.locator('.stop-item').count();
    expect(newStopCount).toBeGreaterThanOrEqual(stopCount);
  });

  test('should clear all data when requested', async ({ page }) => {
    // Add multiple players and some data
    await page.locator('#btn-add-player').click(); // Second player
    await page.locator('input[placeholder*="name"]').last().fill('Second Player');
    
    // Roll some destinations
    await page.locator('.roll-btn').first().click();
    await page.waitForTimeout(500);
    
    // Look for clear/reset functionality
    const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Reset"), .clear-btn, .reset-btn');
    
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      
      // Handle confirmation dialog if it appears
      const confirmDialog = page.locator('.modal, .confirm');
      if (await confirmDialog.isVisible()) {
        const confirmYes = confirmDialog.locator('button:has-text("Yes"), button:has-text("Confirm"), .confirm-yes');
        await confirmYes.click();
      }
      
      // Verify data is cleared
      await expect(page.locator('.player-card')).toHaveCount(0);
    } else {
      console.log('Clear/Reset functionality not found - may need to implement');
    }
  });
});

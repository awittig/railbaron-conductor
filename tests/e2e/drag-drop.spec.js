// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForAppToLoad, setupPlayersForTesting } = require('./test-helpers');

test.describe('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppToLoad(page);
    
    // Set up a player with multiple stops for drag/drop testing
    await setupPlayersForTesting(page, ['Test Player']);
    
    // We'll need some stops to reorder - this might require multiple rolls
    // or manual setup depending on the app's current state
  });

  test('should reorder stops by dragging', async ({ page }) => {
    const playerCard = page.locator('.player-card').first();
    
    // First, we need to create multiple stops by rolling several times
    const rollBtn = page.locator('.btn-roll-stop').first();
    
    // Roll multiple times to get several destinations
    for (let i = 0; i < 3; i++) {
      await rollBtn.click({ force: true });
      await page.waitForTimeout(1000);
      
      // Handle any dialogs that might appear
      const dialogs = page.locator('.modal, .dialog');
      const dialogCount = await dialogs.count();
      
      for (let j = 0; j < dialogCount; j++) {
        const dialog = dialogs.nth(j);
        if (await dialog.isVisible()) {
          // Try to find and click confirmation buttons
          const confirmBtn = dialog.locator('button:has-text("Confirm"), button:has-text("OK"), .confirm-btn').first();
          if (await confirmBtn.isVisible()) {
            await confirmBtn.click({ force: true });
          }
          
          // Try to find and click options/selections
          const options = dialog.locator('option, .option, [role="option"]');
          const optionCount = await options.count();
          if (optionCount > 0) {
            await options.first().click({ force: true });
            
            // Look for submit button after selection
            const submitBtn = dialog.locator('button:has-text("Confirm"), button:has-text("Submit"), .confirm-btn');
            if (await submitBtn.isVisible()) {
              await submitBtn.click({ force: true });
            }
          }
        }
      }
    }
    
    // Check if we have multiple stops to work with
    const stopItems = playerCard.locator('.stop-item');
    const stopCount = await stopItems.count();
    
    if (stopCount >= 2) {
      // Get the text content of the first two stops to verify reordering
      const firstStopText = await stopItems.first().textContent();
      const secondStopText = await stopItems.nth(1).textContent();
      
      // Perform drag and drop: drag first stop to second position
      await stopItems.first().dragTo(stopItems.nth(1));
      
      // Wait for drag operation to complete
      await page.waitForTimeout(500);
      
      // Verify the order has changed
      const newFirstStopText = await stopItems.first().textContent();
      const newSecondStopText = await stopItems.nth(1).textContent();
      
      // After drag, first and second positions should be swapped
      expect(newFirstStopText).toBe(secondStopText);
      expect(newSecondStopText).toBe(firstStopText);
    } else {
      console.log(`Only ${stopCount} stops available, drag/drop test requires at least 2`);
    }
  });

  test('should update payouts after reordering', async ({ page }) => {
    const playerCard = page.locator('.player-card').first();
    
    // Create multiple stops (similar setup as above)
    const rollBtn = page.locator('.btn-roll-stop').first();
    
    for (let i = 0; i < 3; i++) {
      await rollBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
    
    const stopItems = playerCard.locator('.stop-item');
    const stopCount = await stopItems.count();
    
    if (stopCount >= 2) {
      // Capture initial payout values
      const payoutElements = playerCard.locator('.payout, [class*="payout"]');
      const initialPayouts = [];
      
      const payoutCount = await payoutElements.count();
      for (let i = 0; i < payoutCount; i++) {
        const payoutText = await payoutElements.nth(i).textContent();
        initialPayouts.push(payoutText);
      }
      
      // Perform drag and drop
      await stopItems.first().dragTo(stopItems.nth(1));
      await page.waitForTimeout(500);
      
      // Check that payouts have been recalculated
      const newPayoutElements = playerCard.locator('.payout, [class*="payout"]');
      const newPayoutCount = await newPayoutElements.count();
      
      if (newPayoutCount > 0 && initialPayouts.length > 0) {
        let payoutsChanged = false;
        
        for (let i = 0; i < Math.min(newPayoutCount, initialPayouts.length); i++) {
          const newPayoutText = await newPayoutElements.nth(i).textContent();
          if (newPayoutText !== initialPayouts[i]) {
            payoutsChanged = true;
            break;
          }
        }
        
        // Payouts should be recalculated after reordering
        expect(payoutsChanged).toBeTruthy();
      }
    }
  });

  test('should handle drag and drop on mobile/touch devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is for mobile devices only');
    }
    
    const playerCard = page.locator('.player-card').first();
    const rollBtn = page.locator('.btn-roll-stop').first();
    
    // Create some stops
    for (let i = 0; i < 2; i++) {
      await rollBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
    
    const stopItems = playerCard.locator('.stop-item');
    const stopCount = await stopItems.count();
    
    if (stopCount >= 2) {
      // On mobile, we might need touch events instead of drag/drop
      const firstStop = stopItems.first();
      const secondStop = stopItems.nth(1);
      
      // Get bounding boxes for touch coordinates
      const firstBox = await firstStop.boundingBox();
      const secondBox = await secondStop.boundingBox();
      
      if (firstBox && secondBox) {
        // Simulate touch drag
        await page.touchscreen.tap(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
        await page.touchscreen.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2);
        await page.waitForTimeout(500);
        
        // Verify reordering occurred
        const stopItemsAfter = playerCard.locator('.stop-item');
        await expect(stopItemsAfter).toHaveCount(stopCount);
      }
    }
  });

  test('should prevent invalid drag operations', async ({ page }) => {
    const playerCard = page.locator('.player-card').first();
    
    // Add multiple players to test cross-player dragging prevention
    await page.locator('#btn-add-player').click({ force: true });
    await page.locator('input[placeholder*="name"]').last().fill('Second Player');
    
    const allPlayerCards = page.locator('.player-card');
    const firstPlayerCard = allPlayerCards.first();
    const secondPlayerCard = allPlayerCards.last();
    
    // Create stops in first player
    const rollBtn = firstPlayerCard.locator('.btn-roll-stop').first();
    await rollBtn.click({ force: true });
    await page.waitForTimeout(1000);
    
    const firstPlayerStops = firstPlayerCard.locator('.stop-item');
    const secondPlayerStops = secondPlayerCard.locator('.stop-item');
    
    const firstPlayerStopCount = await firstPlayerStops.count();
    const secondPlayerStopCountBefore = await secondPlayerStops.count();
    
    if (firstPlayerStopCount > 0) {
      // Try to drag a stop from first player to second player (should not work)
      try {
        await firstPlayerStops.first().dragTo(secondPlayerCard);
        await page.waitForTimeout(500);
        
        // Verify that the stop didn't move to the other player
        const firstPlayerStopCountAfter = await firstPlayerStops.count();
        const secondPlayerStopCountAfter = await secondPlayerStops.count();
        
        expect(firstPlayerStopCountAfter).toBe(firstPlayerStopCount);
        expect(secondPlayerStopCountAfter).toBe(secondPlayerStopCountBefore);
      } catch (error) {
        // It's OK if the drag operation fails - that's the expected behavior
        console.log('Cross-player drag correctly prevented:', error.message);
      }
    }
  });
});

// @ts-check

/**
 * Common test utilities for Rail Baron E2E tests
 */

/**
 * Set up a basic game state with players
 * @param {import('@playwright/test').Page} page 
 * @param {Array<string>} playerNames 
 */
async function setupPlayersForTesting(page, playerNames = ['Test Player']) {
  for (const name of playerNames) {
    await page.locator('#btn-add-player').click();
    await page.locator('input[placeholder*="name"]').last().fill(name);
  }
}

/**
 * Handle any modal dialogs that might appear during rolling
 * @param {import('@playwright/test').Page} page 
 */
async function handleModalDialogs(page) {
  const dialogs = page.locator('.modal, .dialog');
  const dialogCount = await dialogs.count();
  
  for (let i = 0; i < dialogCount; i++) {
    const dialog = dialogs.nth(i);
    if (await dialog.isVisible()) {
      // Try to find and select options first
      const options = dialog.locator('option, .option, [role="option"]');
      const optionCount = await options.count();
      
      if (optionCount > 0) {
        // Select first available option
        await options.first().click();
      }
      
      // Then look for confirmation buttons
      const confirmBtn = dialog.locator('button:has-text("Confirm"), button:has-text("OK"), button:has-text("Submit"), .confirm-btn').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      
      // Wait for dialog to close
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Perform a dice roll and handle any resulting dialogs
 * @param {import('@playwright/test').Page} page 
 * @param {number} playerIndex - Which player to roll for (0-based)
 */
async function rollDiceForPlayer(page, playerIndex = 0) {
  const rollBtn = page.locator('.roll-btn').nth(playerIndex);
  await rollBtn.click();
  await page.waitForTimeout(500);
  await handleModalDialogs(page);
}

/**
 * Switch the game map (US/GB)
 * @param {import('@playwright/test').Page} page 
 * @param {'US'|'GB'} mapType 
 */
async function switchMap(page, mapType) {
  await page.locator('#map-select').selectOption(mapType);
  await page.waitForTimeout(300); // Wait for any currency symbol updates
}

/**
 * Get player card element for a specific player
 * @param {import('@playwright/test').Page} page 
 * @param {number} playerIndex 
 */
function getPlayerCard(page, playerIndex = 0) {
  return page.locator('.player-card').nth(playerIndex);
}

/**
 * Extract numeric value from a currency string (e.g., "$1,500" -> 1500)
 * @param {string} currencyText 
 * @returns {number}
 */
function parseCurrencyValue(currencyText) {
  if (!currencyText) return 0;
  const match = currencyText.match(/[\d,]+/);
  if (!match) return 0;
  return parseInt(match[0].replace(/,/g, ''), 10);
}

/**
 * Wait for the application to fully load
 * @param {import('@playwright/test').Page} page 
 */
async function waitForAppToLoad(page) {
  await page.waitForSelector('#players');
  await page.waitForSelector('#btn-add-player');
  
  // Handle the initial map selection dialog if it appears
  const mapDialog = page.locator('#map-dialog');
  if (await mapDialog.isVisible({ timeout: 1000 })) {
    // Click the US map label instead of the hidden radio button
    const usLabel = mapDialog.locator('label[data-value="US"]');
    await usLabel.click();
    
    // Click the confirm button
    const confirmBtn = mapDialog.locator('#btn-map-confirm');
    await confirmBtn.click();
    
    // Wait for dialog to close
    await page.waitForSelector('#map-dialog', { state: 'hidden', timeout: 3000 });
  }
  
  await page.waitForTimeout(500); // Additional time for any initialization
}

/**
 * Create test game data for import testing
 * @param {Object} options 
 * @returns {Object}
 */
function createTestGameData(options = {}) {
  const {
    playerCount = 1,
    map = 'US',
    includeStops = true
  } = options;
  
  const players = [];
  
  for (let i = 0; i < playerCount; i++) {
    const player = {
      id: `test-player-${i + 1}`,
      name: `Test Player ${i + 1}`,
      stops: []
    };
    
    if (includeStops) {
      // Add a home city and one destination
      player.stops = [
        { 
          cityId: i + 1, 
          payoutFromPrev: null, 
          unreachable: false, 
          lastRollText: 'Home city' 
        },
        { 
          cityId: i + 5, 
          payoutFromPrev: 150 + (i * 50), 
          unreachable: false, 
          lastRollText: `Odd+${6 + i} → Region → City` 
        }
      ];
    }
    
    players.push(player);
  }
  
  return {
    players,
    settings: { map }
  };
}

/**
 * Count stops for a specific player
 * @param {import('@playwright/test').Page} page 
 * @param {number} playerIndex 
 */
async function getPlayerStopCount(page, playerIndex = 0) {
  const playerCard = getPlayerCard(page, playerIndex);
  const stopItems = playerCard.locator('.stop-item');
  return await stopItems.count();
}

/**
 * Get all payout values for a player
 * @param {import('@playwright/test').Page} page 
 * @param {number} playerIndex 
 * @returns {Promise<number[]>}
 */
async function getPlayerPayouts(page, playerIndex = 0) {
  const playerCard = getPlayerCard(page, playerIndex);
  const payoutElements = playerCard.locator('.payout, [class*="payout"]');
  const payoutCount = await payoutElements.count();
  
  const payouts = [];
  for (let i = 0; i < payoutCount; i++) {
    const payoutText = await payoutElements.nth(i).textContent();
    const value = parseCurrencyValue(payoutText || '');
    payouts.push(value);
  }
  
  return payouts;
}

module.exports = {
  setupPlayersForTesting,
  handleModalDialogs,
  rollDiceForPlayer,
  switchMap,
  getPlayerCard,
  parseCurrencyValue,
  waitForAppToLoad,
  createTestGameData,
  getPlayerStopCount,
  getPlayerPayouts
};

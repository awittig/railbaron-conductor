// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Rail Baron Game Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game interface', async ({ page }) => {
    // Check that the main elements are present
    await expect(page.locator('h1')).toContainText('Rail Baron');
    await expect(page.locator('#players-section')).toBeVisible();
    await expect(page.locator('#map-controls')).toBeVisible();
  });

  test('should switch between US and GB maps', async ({ page }) => {
    // Test map switching functionality
    const mapSelect = page.locator('#map-select');
    await expect(mapSelect).toBeVisible();

    // Switch to GB map
    await mapSelect.selectOption('GB');
    await expect(page.locator('body')).toContainText('£'); // Should show pound symbol

    // Switch back to US map
    await mapSelect.selectOption('US');
    await expect(page.locator('body')).toContainText('$'); // Should show dollar symbol
  });

  test('should add and manage players', async ({ page }) => {
    const addPlayerBtn = page.locator('#add-player-btn');
    const playersContainer = page.locator('#players-container');

    // Add first player
    await addPlayerBtn.click();
    await expect(playersContainer.locator('.player-card')).toHaveCount(1);

    // Add second player
    await addPlayerBtn.click();
    await expect(playersContainer.locator('.player-card')).toHaveCount(2);

    // Check that players have name inputs
    const playerNameInputs = playersContainer.locator('input[placeholder*="name"]');
    await expect(playerNameInputs).toHaveCount(2);

    // Enter player names
    await playerNameInputs.first().fill('Alice');
    await playerNameInputs.last().fill('Bob');

    // Verify names are saved
    await expect(playerNameInputs.first()).toHaveValue('Alice');
    await expect(playerNameInputs.last()).toHaveValue('Bob');
  });

  test('should remove players', async ({ page }) => {
    const addPlayerBtn = page.locator('#add-player-btn');
    const playersContainer = page.locator('#players-container');

    // Add two players
    await addPlayerBtn.click();
    await addPlayerBtn.click();
    await expect(playersContainer.locator('.player-card')).toHaveCount(2);

    // Remove one player
    const removeBtn = playersContainer.locator('.remove-player-btn').first();
    await removeBtn.click();
    await expect(playersContainer.locator('.player-card')).toHaveCount(1);
  });

  test('should persist game state', async ({ page }) => {
    // Add a player and set their name
    await page.locator('#add-player-btn').click();
    const nameInput = page.locator('input[placeholder*="name"]').first();
    await nameInput.fill('Test Player');

    // Switch map
    await page.locator('#map-select').selectOption('GB');

    // Reload the page
    await page.reload();

    // Check that state is restored
    await expect(page.locator('input[placeholder*="name"]').first()).toHaveValue('Test Player');
    await expect(page.locator('#map-select')).toHaveValue('GB');
    await expect(page.locator('.player-card')).toHaveCount(1);
  });
});

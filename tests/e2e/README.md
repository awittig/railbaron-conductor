# Rail Baron Conductor - E2E Tests

End-to-end tests for the Rail Baron Conductor application using Playwright.

## Test Structure

### Core Test Suites

- **`smoke.spec.js`** - Basic functionality and application loading tests
- **`game-setup.spec.js`** - Player management, map switching, and game initialization
- **`rolling-destinations.spec.js`** - Dice rolling, destination selection, and payout calculations
- **`data-management.spec.js`** - Import/export functionality, data persistence, and state management
- **`drag-drop.spec.js`** - Drag and drop functionality for reordering stops

### Helper Utilities

- **`test-helpers.js`** - Common utilities and helper functions for tests

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with debugger
npm run test:e2e:debug

# Run both unit and E2E tests
npm run test:all
```

## Test Configuration

The tests are configured in `playwright.config.js` with:

- **Cross-browser testing**: Chrome, Firefox, Safari
- **Automatic server startup**: Python HTTP server on port 8080
- **Visual regression**: Screenshots on failure
- **Tracing**: Enabled for debugging failed tests

## Test Data

Tests use realistic game scenarios:

- Multiple players with different names
- Various dice roll outcomes
- Different map configurations (US/GB)
- Complex stop sequences and payout calculations

## Key Testing Areas

### 🎲 Game Mechanics
- Dice rolling and destination selection
- Payout calculations and verification
- Region and city selection dialogs
- Home city establishment

### 👥 Player Management
- Adding and removing players
- Player name editing
- Multiple player scenarios

### 🗺️ Map Functionality
- US ↔ GB map switching
- Currency symbol updates ($ ↔ £)
- Different city and region sets

### 📊 Data Management
- Game state persistence
- JSON import/export
- CSV statistics export
- Browser refresh recovery

### 🎯 User Interactions
- Drag and drop stop reordering
- Modal dialog handling
- Form input validation
- Error handling

## Writing New Tests

### Test Organization

```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Common setup
  });

  test('should do something specific', async ({ page }) => {
    // Test implementation
  });
});
```

### Using Helper Functions

```javascript
const { setupPlayersForTesting, rollDiceForPlayer } = require('./test-helpers');

test('example test', async ({ page }) => {
  await setupPlayersForTesting(page, ['Alice', 'Bob']);
  await rollDiceForPlayer(page, 0); // Roll for first player
});
```

### Best Practices

1. **Use Descriptive Test Names**: Tests should clearly describe what they verify
2. **Handle Async Operations**: Always await page interactions and use proper waits
3. **Test User Journeys**: Focus on complete workflows rather than individual actions
4. **Handle Modal Dialogs**: Use helper functions to consistently handle game dialogs
5. **Verify State Changes**: Always check that actions produce expected results
6. **Cross-Browser Compatibility**: Tests run on Chrome, Firefox, and Safari
7. **Mobile Considerations**: Some tests include mobile-specific scenarios

### Common Patterns

```javascript
// Waiting for elements
await expect(page.locator('.element')).toBeVisible();

// Handling optional dialogs
if (await dialog.isVisible()) {
  await dialog.locator('.confirm-btn').click();
}

// Verifying game state
const stopCount = await page.locator('.stop-item').count();
expect(stopCount).toBeGreaterThan(0);

// Testing data persistence
await page.reload();
await expect(page.locator('.restored-data')).toBeVisible();
```

## Debugging Tests

### Visual Debugging
```bash
npm run test:e2e:ui  # Interactive mode with browser
npm run test:e2e:headed  # See browser actions
```

### Trace Analysis
Failed tests automatically generate traces that can be viewed with:
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots
Screenshots are automatically captured on test failures and saved in `test-results/`.

## CI/CD Integration

Tests are configured for CI environments with:
- Reduced parallelism for stability
- Retry logic for flaky tests
- HTML reports for results analysis
- Automatic browser installation

## Troubleshooting

### Common Issues

1. **Timing Issues**: Use `page.waitForTimeout()` or better yet, `expect().toBeVisible()` for proper waiting
2. **Dialog Handling**: Ensure modal dialogs are properly closed before continuing
3. **Element Selection**: Use data attributes or stable selectors rather than classes that might change
4. **State Cleanup**: Each test should be independent and not rely on previous test state

### Server Issues
If tests fail to start the server:
```bash
# Start server manually
python -m http.server 8080

# Then run tests
npm run test:e2e
```

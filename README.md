# Rail Baron Conductor

A web-based conductor for the Rail Baron board game, supporting both US and British versions.

## Features

- **US Version**: Complete US city payout tables and destination charts
- **British Version**: Complete British city payout tables and destination charts
- **Interactive Interface**: Easy switching between map versions
- **Accurate Payouts**: Verified payout calculations for all city pairs

## Testing

This project includes a comprehensive test suite to ensure payout accuracy and system reliability.

### Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests** (`test/payouts.test.js`): Test individual payout calculations and data integrity
- **Integration Tests** (`test/integration.test.js`): Test complete payout flow and system integration
- **Test Setup** (`test/setup.js`): Test environment configuration

### Key Test Cases

- ✅ **Hereford to Bangor payout**: Verified to be 8 (corrected from 15)
- ✅ **Matrix validation**: Ensures all payout values are valid
- ✅ **City resolution**: Tests city name to ID mapping
- ✅ **Error handling**: Graceful handling of invalid inputs
- ✅ **Performance**: Efficient payout calculations

## Recent Fixes

### Hereford to Bangor Payout Correction

**Issue**: The payout from Hereford to Bangor was incorrectly showing as 15 instead of 8.

**Solution**: Updated the payout matrix in `boxcars-britain-tables.js` to correct the value from 15 to 8.

**Location**: Row 42 (Hereford), Column 3 (Bangor) in the `payoffTableGB.matrix`

**Verification**: The test suite now includes specific tests to verify this payout is correct.

## Development

### Project Structure

```
railbaron-conductor/
├── app.js                      # Main application logic
├── payouts.js                  # US payout tables
├── boxcars-tables.js          # US game tables
├── boxcars-britain-tables.js  # British game tables
├── test/                      # Test suite
│   ├── setup.js              # Test environment setup
│   ├── payouts.test.js       # Unit tests
│   └── integration.test.js    # Integration tests
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

### Adding New Tests

When adding new payout data or fixing issues:

1. **Update the data**: Modify the appropriate table file
2. **Add tests**: Create tests to verify the fix
3. **Run tests**: Ensure all tests pass
4. **Update documentation**: Document the change

### Testing Best Practices

- **Test the specific issue**: Always include tests for the specific problem being fixed
- **Test edge cases**: Include tests for invalid inputs and boundary conditions
- **Test data integrity**: Verify matrix dimensions and data consistency
- **Performance testing**: Ensure the system remains efficient

## License

MIT License - see LICENSE file for details.

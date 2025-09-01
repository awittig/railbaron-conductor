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

- **Core Unit Tests** (`test/core/`): Test individual core modules with focused, isolated tests
  - `payouts.test.js`: Payout calculation logic and edge cases
  - `derived.test.js`: Derived field calculations (regions, visited cities)
  - `stats.test.js`: Statistics computation and CSV generation
  - `rolling.test.js`: Dice rolling and destination selection logic
- **Integration Tests** (`test/integration.test.js`): End-to-end system integration tests
- **Legacy Tests** (`test/payouts.test.js`): Comprehensive payout validation and data integrity
- **Test Setup** (`test/setup.js`): Test environment configuration and module loading

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
├── index.html                 # Main entry point (loads all modules)
├── app.js                     # Application orchestrator (state, rendering, UI)
├── src/                       # Modular source code
│   ├── core/                  # Core business logic modules
│   │   ├── models.js          # Data models and constructors
│   │   ├── payouts.js         # Payout calculation functions
│   │   ├── derived.js         # Derived field calculations
│   │   ├── stats.js           # Statistics and CSV generation
│   │   ├── format.js          # Formatting utilities (currency, HTML, CSV)
│   │   ├── rolling.js         # Dice rolling and destination logic
│   │   └── state.js           # State management utilities
│   └── ui/                    # UI components and dialogs
│       ├── components/        # Reusable UI components
│       │   ├── playerCard.js  # Player card rendering
│       │   └── stopItem.js    # Stop list item rendering
│       ├── dialogs/           # Modal dialog handlers
│       │   ├── statsDialog.js # Statistics table dialog
│       │   ├── regionDialog.js # Region selection dialog
│       │   ├── homeCityDialog.js # Home city selection dialog
│       │   └── mapDialog.js   # Map switching dialog
│       ├── controllers.js     # UI event handlers and orchestration
│       └── dragdrop.js        # Drag and drop functionality
├── generated/                 # Generated data files (preferred)
│   ├── boxcars-us-tables.generated.js     # Generated US tables
│   └── boxcars-britain-tables.generated.js # Generated British tables
├── boxcars-tables.js          # Fallback US game tables
├── boxcars-britain-tables.js  # Fallback British game tables
├── test/                      # Comprehensive test suite
│   ├── core/                  # Unit tests for core modules
│   │   ├── payouts.test.js    # Payout calculation tests
│   │   ├── derived.test.js    # Derived field tests
│   │   ├── stats.test.js      # Statistics tests
│   │   └── rolling.test.js    # Rolling logic tests
│   ├── integration.test.js    # End-to-end integration tests
│   ├── payouts.test.js        # Legacy payout validation tests
│   └── setup.js               # Test environment configuration
├── legacy/                    # Archived legacy files
│   ├── railbaron-app.js       # Legacy AngularJS implementation
│   ├── railbaron.js           # Legacy jQuery implementation
│   ├── player.js              # Legacy player constructor
│   └── payouts.js             # Legacy US payout implementation
├── package.json               # Dependencies and scripts
├── report.md                  # Code review findings and recommendations
└── README.md                  # This file
```

## Architecture

### Module Design

The application follows a **modular, dependency-free browser architecture** with clear separation of concerns:

- **Core Modules** (`src/core/`): Pure business logic, no DOM dependencies
- **UI Modules** (`src/ui/`): DOM manipulation and user interaction
- **Global Namespace**: `window.RB` for browser compatibility
- **Dual Environment**: Supports both browser (via globals) and Node.js (via `module.exports`)

### Key Architectural Principles

1. **Functional Programming**: Core modules use pure functions where possible
2. **Dependency Injection**: UI functions receive dependencies as parameters (e.g., `formatCurrency`, `recomputeAllPayouts`)
3. **Stateless Rendering**: UI components are stateless and driven by data
4. **Data Immutability**: State changes go through centralized functions
5. **Module Boundaries**: Clear interfaces between core logic and UI

### Data Flow

```
index.html → loads modules → app.js orchestrates → src/core/ (business logic) ← → src/ui/ (rendering)
                                ↓
                         browser globals (window.RB)
                                ↓
                         state management & persistence
```

### Adding New Features

When adding new functionality:

1. **Core Logic First**: Implement business logic in `src/core/` modules
2. **Add Unit Tests**: Create focused unit tests for the core logic
3. **UI Layer**: Add UI components in `src/ui/` that consume core functions
4. **Integration**: Wire everything together in `app.js`
5. **Integration Tests**: Add end-to-end tests for the complete feature

### Code Style Guidelines

- **Keep it Simple**: Prefer simple, readable code over clever optimizations
- **Pure Functions**: Make functions pure and testable where possible
- **Dependency Injection**: Pass dependencies as parameters rather than using globals
- **Error Handling**: Handle edge cases gracefully (null checks, validation)
- **Consistent Naming**: Use clear, descriptive function and variable names

### Testing Strategy

- **Unit Tests**: Test individual functions with mocked dependencies
- **Integration Tests**: Test complete workflows with real data
- **Edge Case Coverage**: Test null inputs, boundary conditions, and error cases
- **Performance Verification**: Ensure calculations remain efficient
- **Data Integrity**: Validate payout matrices and city mappings

### Legacy Code

Legacy implementations are preserved in the `legacy/` folder for reference:
- **Do not modify** legacy files - they are archived for historical purposes
- **Use `src/` modules** for all new development
- **Prefer generated data** files over hand-maintained tables when available

### Data Management

- **Generated Data**: Use `generated/` files when available (authoritative)
- **Fallback Data**: Use root-level table files as fallbacks
- **Data Validation**: Always validate data integrity in tests
- **City Mapping**: Maintain consistent city ID and name mappings across versions

### Contributing Guidelines

1. **Follow the Module Pattern**: Keep core logic separate from UI code
2. **Write Tests First**: Add tests for new functionality before implementation
3. **Commit Frequently**: Make small, atomic commits with clear messages
4. **Document Changes**: Update README.md and add inline comments for complex logic
5. **Run Full Test Suite**: Ensure all tests pass before committing
6. **Review report.md**: Check for any architectural recommendations before major changes

## License

MIT License - see LICENSE file for details.

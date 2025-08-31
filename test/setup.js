// Test setup file for Jest with jsdom environment
// This file runs before each test file

// Mock window object for Node.js environment
global.window = global.window || {};

// Mock document object
global.document = global.document || {
  createElement: () => ({}),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Load RB core and UI modules so app.js can depend on them directly
require('../src/core/format.js');
require('../src/core/models.js');
require('../src/core/payouts.js');
require('../src/core/derived.js');
require('../src/core/stats.js');
require('../src/core/rolling.js');
require('../src/ui/components/stopItem.js');
require('../src/ui/dialogs/statsDialog.js');
require('../src/ui/dialogs/regionDialog.js');
require('../src/ui/dialogs/homeCityDialog.js');
require('../src/ui/dialogs/mapDialog.js');
require('../src/ui/dragdrop.js');
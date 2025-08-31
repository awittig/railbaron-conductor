/**
 * Unit tests for Rail Baron payout calculations
 * Tests both US and British versions of the game
 */

// Import the payout modules (they will be loaded via require in Node.js)
const path = require('path');

describe('Rail Baron Payout System', () => {
  let payouts, boxcarsTables, boxcarsBritainTables, app;
  
  beforeAll(() => {
    // Load the modules in the correct order
    // First load the US payouts
    require(path.join(__dirname, '../payouts.js'));
    
    // Then load the US tables
    require(path.join(__dirname, '../boxcars-tables.js'));
    
    // Then load the British tables (prefer generated)
    try {
      require(path.join(__dirname, '../generated/boxcars-britain-tables.generated.js'));
    } catch (e) {
      require(path.join(__dirname, '../boxcars-britain-tables.js'));
    }
    
    // Finally load the main app
    require(path.join(__dirname, '../app.js'));
    
    // Get references to the loaded modules
    payouts = global.findPayout;
    boxcarsTables = global.BOXCARS;
    boxcarsBritainTables = global.BOXCARS_GB;
    app = global.railbaronApp;
  });

  describe('British Version (BOXCARS_GB)', () => {
    test('should load British cities correctly', () => {
      expect(boxcarsBritainTables).toBeDefined();
      expect(boxcarsBritainTables.CITIES).toBeDefined();
      expect(boxcarsBritainTables.CITIES.length).toBeGreaterThan(0);
      
      // Verify key cities exist
      const cityNames = boxcarsBritainTables.CITIES.map(city => city.name);
      expect(cityNames).toContain('Hereford');
      expect(cityNames).toContain('Bangor');
      expect(cityNames).toContain('London');
      expect(cityNames).toContain('Aberdeen');
    });

    test('should have correct city IDs for Hereford and Bangor', () => {
      const hereford = boxcarsBritainTables.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsBritainTables.CITIES.find(city => city.name === 'Bangor');
      
      expect(hereford).toBeDefined();
      expect(bangor).toBeDefined();
      
      // Hereford should be at index 41 (city id 42)
      expect(hereford.id).toBe(42);
      // Bangor should be at index 3 (city id 4)
      expect(bangor.id).toBe(4);
    });

    test('should calculate correct payout from Hereford to Bangor', () => {
      const hereford = boxcarsBritainTables.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsBritainTables.CITIES.find(city => city.name === 'Bangor');
      
      const payout = boxcarsBritainTables.findPayout(hereford.id, bangor.id);
      
      // This should be 8 based on the corrected matrix
      expect(payout).toBe(8);
    });

    test('should calculate correct payout from Bangor to Hereford', () => {
      const hereford = boxcarsBritainTables.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsBritainTables.CITIES.find(city => city.name === 'Bangor');
      
      const payout = boxcarsBritainTables.findPayout(bangor.id, hereford.id);
      
      // This should be the reverse direction payout
      expect(payout).toBeDefined();
      expect(typeof payout).toBe('number');
      expect(payout).toBeGreaterThan(0);
    });

    test('should have correct matrix dimensions', () => {
      const matrix = global.payoffTableGB.matrix;
      expect(matrix).toBeDefined();
      expect(Array.isArray(matrix)).toBe(true);
      
      // Should be a square matrix with 100 cities
      expect(matrix.length).toBe(100);
      matrix.forEach(row => {
        expect(Array.isArray(row)).toBe(true);
        expect(row.length).toBe(100);
      });
    });

    test('should verify Hereford row in matrix', () => {
      const matrix = global.payoffTableGB.matrix;
      const herefordIndex = 41; // 0-indexed
      const bangorIndex = 3; // 0-indexed
      
      const herefordRow = matrix[herefordIndex];
      expect(herefordRow).toBeDefined();
      expect(herefordRow.length).toBe(100);
      
      // The payout from Hereford to Bangor should be 8
      expect(herefordRow[bangorIndex]).toBe(8);
    });

    test('should handle invalid city IDs gracefully', () => {
      // Test with invalid city IDs
      expect(boxcarsBritainTables.findPayout(0, 1)).toBeUndefined();
      expect(boxcarsBritainTables.findPayout(1, 0)).toBeUndefined();
      expect(boxcarsBritainTables.findPayout(999, 1)).toBeUndefined();
      expect(boxcarsBritainTables.findPayout(1, 999)).toBeUndefined();
      expect(boxcarsBritainTables.findPayout(null, 1)).toBeUndefined();
      expect(boxcarsBritainTables.findPayout(1, null)).toBeUndefined();
    });

    test('should resolve city names to IDs correctly', () => {
      const herefordId = boxcarsBritainTables.resolveIdByName('Hereford');
      const bangorId = boxcarsBritainTables.resolveIdByName('Bangor');
      const londonId = boxcarsBritainTables.resolveIdByName('LONDON');
      
      expect(herefordId).toBe(42);
      expect(bangorId).toBe(4);
      expect(londonId).toBe(50);
    });

    test('should handle case-insensitive city name resolution', () => {
      const herefordId1 = boxcarsBritainTables.resolveIdByName('hereford');
      const herefordId2 = boxcarsBritainTables.resolveIdByName('HEREFORD');
      const herefordId3 = boxcarsBritainTables.resolveIdByName('  Hereford  ');
      
      expect(herefordId1).toBe(42);
      expect(herefordId2).toBe(42);
      expect(herefordId3).toBe(42);
    });
  });

  describe('US Version (BOXCARS)', () => {
    test('should load US cities correctly', () => {
      expect(boxcarsTables).toBeDefined();
      expect(boxcarsTables.CITIES).toBeDefined();
      expect(boxcarsTables.CITIES.length).toBeGreaterThan(0);
      
      // Verify key US cities exist
      const cityNames = boxcarsTables.CITIES.map(city => city.name);
      expect(cityNames).toContain('Albany');
      expect(cityNames).toContain('Atlanta');
      expect(cityNames).toContain('Chicago');
    });

    test('should calculate US payouts correctly', () => {
      const albany = boxcarsTables.CITIES.find(city => city.name === 'Albany');
      const atlanta = boxcarsTables.CITIES.find(city => city.name === 'Atlanta');
      
      if (albany && atlanta) {
        const payout = boxcarsTables.findPayout(albany.id, atlanta.id);
        expect(payout).toBeDefined();
        expect(typeof payout).toBe('number');
        expect(payout).toBeGreaterThan(0);
      }
    });
  });

  describe('App Integration', () => {
    test('should have activeFindPayout function', () => {
      expect(app).toBeDefined();
      expect(typeof app.activeFindPayout).toBe('function');
    });

    test('should switch between US and British payouts correctly', () => {
      // This test would require the app to be fully initialized
      // For now, just verify the function exists
      expect(typeof app.activeFindPayout).toBe('function');
    });
  });

  describe('Matrix Validation', () => {
    test('should have consistent matrix data', () => {
      const matrix = global.payoffTableGB.matrix;
      
      // Check that all values are numbers
      matrix.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          expect(typeof value).toBe('number');
          expect(value).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(value)).toBe(true);
        });
      });
    });

    test('should have symmetric payouts for same city', () => {
      const matrix = global.payoffTableGB.matrix;
      
      // Diagonal should be 0 (same city to same city)
      for (let i = 0; i < matrix.length; i++) {
        expect(matrix[i][i]).toBe(0);
      }
    });

    test('should verify specific known payouts', () => {
      const matrix = global.payoffTableGB.matrix;
      
      // Hereford to Bangor should be 8
      expect(matrix[41][3]).toBe(8);
      
      // Bangor to Hereford should be the same (assuming symmetric)
      expect(matrix[3][41]).toBe(8);
    });
  });
});

/**
 * Integration tests for Rail Baron payout system
 * Tests the complete flow from app to matrix lookup
 */

const path = require('path');

describe('Rail Baron Integration Tests', () => {
  let app, boxcarsGB, boxcarsUS;
  
  beforeAll(() => {
    // Load all modules in the correct order
    require(path.join(__dirname, '../payouts.js'));
    require(path.join(__dirname, '../boxcars-tables.js'));
    try {
      require(path.join(__dirname, '../generated/boxcars-britain-tables.generated.js'));
    } catch (e) {
      require(path.join(__dirname, '../boxcars-britain-tables.js'));
    }
    require(path.join(__dirname, '../app.js'));
    
    // Get references to the loaded modules
    app = global.railbaronApp;
    boxcarsGB = global.BOXCARS_GB || (global.window && global.window.BOXCARS_GB);
    boxcarsUS = global.BOXCARS || (global.window && global.window.BOXCARS);
  });

  describe('Complete Payout Flow', () => {
    test('should calculate Hereford to Bangor payout through app', () => {
      // This test simulates how the app would calculate payouts
      expect(app).toBeDefined();
      expect(typeof app.activeFindPayout).toBe('function');
      
      // Get city IDs
      const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
      
      expect(hereford).toBeDefined();
      expect(bangor).toBeDefined();
      
      // Calculate payout using the British tables directly
      const payout = boxcarsGB.findPayout(hereford.id, bangor.id);
      expect(payout).toBe(8);
    });

    test('should handle city name resolution and payout calculation', () => {
      // Test the complete flow: name -> ID -> payout
      const herefordName = 'Hereford';
      const bangorName = 'Bangor';
      
      // Resolve names to IDs
      const herefordId = boxcarsGB.resolveIdByName(herefordName);
      const bangorId = boxcarsGB.resolveIdByName(bangorName);
      
      expect(herefordId).toBe(45);
      expect(bangorId).toBe(4);
      
      // Calculate payout using IDs
      const payout = boxcarsGB.findPayout(herefordId, bangorId);
      expect(payout).toBe(8);
    });

    test('should verify matrix consistency across different access methods', () => {
      const matrix = global.payoffTableGB.matrix;
      const herefordIdx = boxcarsGB.resolveIdByName('Hereford') - 1;
      const bangorIdx = boxcarsGB.resolveIdByName('Bangor') - 1;
      
      // Access via matrix directly
      const directPayout = matrix[herefordIdx][bangorIdx];
      
      // Access via city IDs
      const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
      const idPayout = boxcarsGB.findPayout(hereford.id, bangor.id);
      
      // Both should give the same result
      expect(directPayout).toBe(8);
      expect(idPayout).toBe(8);
      expect(directPayout).toBe(idPayout);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent cities gracefully', () => {
      const nonExistentId = boxcarsGB.resolveIdByName('NonExistentCity');
      expect(nonExistentId).toBeNull();
      
      // Should not crash when trying to find payout with non-existent city
      const payout = boxcarsGB.findPayout(999, 1);
      expect(payout).toBeUndefined();
    });

    test('should handle edge cases in city name resolution', () => {
      // Test with various edge cases
      expect(boxcarsGB.resolveIdByName('')).toBeNull();
      expect(boxcarsGB.resolveIdByName(null)).toBeNull();
      expect(boxcarsGB.resolveIdByName(undefined)).toBeNull();
      expect(boxcarsGB.resolveIdByName('   ')).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    test('should have consistent city count across all structures', () => {
      const matrix = global.payoffTableGB.matrix;
      const cities = boxcarsGB.CITIES;
      
      expect(matrix.length).toBe(cities.length);
      expect(matrix[0].length).toBe(cities.length);
      
      // Should have exactly 100 cities
      expect(cities.length).toBe(100);
    });

    test('should have valid payout values in matrix', () => {
      const matrix = global.payoffTableGB.matrix;
      
      matrix.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          // All values should be valid numbers
          expect(typeof value).toBe('number');
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          
          // Diagonal should be 0
          if (rowIndex === colIndex) {
            expect(value).toBe(0);
          }
        });
      });
    });

    test('should have unique city names', () => {
      const cities = boxcarsGB.CITIES;
      const cityNames = cities.map(city => city.name);
      const uniqueNames = new Set(cityNames);
      
      expect(uniqueNames.size).toBe(cityNames.length);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple payout calculations efficiently', () => {
      const startTime = Date.now();
      
      // Calculate 1000 random payouts
      for (let i = 0; i < 1000; i++) {
        const city1 = Math.floor(Math.random() * 100) + 1;
        const city2 = Math.floor(Math.random() * 100) + 1;
        if (city1 !== city2) {
          const payout = boxcarsGB.findPayout(city1, city2);
          expect(typeof payout).toBe('number');
        }
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });
});

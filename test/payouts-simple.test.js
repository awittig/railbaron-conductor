/**
 * Simplified unit tests for Rail Baron payout calculations
 * Tests only the payout functionality without DOM dependencies
 */

const path = require('path');

describe('Rail Baron Payout System - Simplified Tests', () => {
  let boxcarsGB, payoffTableGB;
  
  beforeAll(() => {
    // Load only the British tables module
    require(path.join(__dirname, '../boxcars-britain-tables.js'));
    
    // Get references to the loaded modules
    boxcarsGB = global.BOXCARS_GB;
    payoffTableGB = global.payoffTableGB;
    
    console.log('=== DEBUG: Module Loading ===');
    console.log('boxcarsGB loaded:', !!boxcarsGB);
    console.log('payoffTableGB loaded:', !!payoffTableGB);
    if (boxcarsGB) {
      console.log('BOXCARS_GB.CITIES length:', boxcarsGB.CITIES?.length);
      console.log('BOXCARS_GB.findPayout function:', typeof boxcarsGB.findPayout);
    }
    if (payoffTableGB) {
      console.log('payoffTableGB.cities length:', payoffTableGB.cities?.length);
      console.log('payoffTableGB.matrix length:', payoffTableGB.matrix?.length);
    }
  });

  describe('British Version (BOXCARS_GB)', () => {
    test('should load British cities correctly', () => {
      expect(boxcarsGB).toBeDefined();
      expect(boxcarsGB.CITIES).toBeDefined();
      expect(boxcarsGB.CITIES.length).toBeGreaterThan(0);
      
      // Verify key cities exist
      const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
      
      console.log('=== DEBUG: City Lookup ===');
      console.log('Hereford found:', !!hereford);
      if (hereford) {
        console.log('Hereford details:', {
          name: hereford.name,
          id: hereford.id,
          index: hereford.id - 1
        });
      }
      console.log('Bangor found:', !!bangor);
      if (bangor) {
        console.log('Bangor details:', {
          name: bangor.name,
          id: bangor.id,
          index: bangor.id - 1
        });
      }
      
      expect(hereford).toBeDefined();
      expect(bangor).toBeDefined();
    });

    test('should have correct payout matrix structure', () => {
      expect(payoffTableGB).toBeDefined();
      expect(payoffTableGB.matrix).toBeDefined();
      expect(payoffTableGB.matrix.length).toBeGreaterThan(0);
      
      console.log('=== DEBUG: Matrix Structure ===');
      console.log('Matrix rows:', payoffTableGB.matrix.length);
      if (payoffTableGB.matrix.length > 0) {
        console.log('First row length:', payoffTableGB.matrix[0].length);
        console.log('First row sample:', payoffTableGB.matrix[0].slice(0, 10));
      }
      
      // Check if matrix has the expected dimensions
      const expectedCities = payoffTableGB.cities.length;
      expect(payoffTableGB.matrix.length).toBe(expectedCities);
      if (payoffTableGB.matrix.length > 0) {
        expect(payoffTableGB.matrix[0].length).toBe(expectedCities);
      }
    });

    test('should calculate Hereford to Bangor payout correctly', () => {
      const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
      const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
      
      expect(hereford).toBeDefined();
      expect(bangor).toBeDefined();
      
      // Calculate expected matrix indices
      const herefordIndex = hereford.id - 1;
      const bangorIndex = bangor.id - 1;
      
      console.log('=== DEBUG: Payout Calculation ===');
      console.log('Hereford index:', herefordIndex, '(city id:', hereford.id, ')');
      console.log('Bangor index:', bangorIndex, '(city id:', bangor.id, ')');
      
      // Check matrix bounds
      console.log('Matrix dimensions:', {
        rows: payoffTableGB.matrix.length,
        cols: payoffTableGB.matrix[0]?.length || 0
      });
      
      // Check if indices are within bounds
      const rowInBounds = herefordIndex >= 0 && herefordIndex < payoffTableGB.matrix.length;
      const colInBounds = bangorIndex >= 0 && bangorIndex < payoffTableGB.matrix[0]?.length;
      
      console.log('Indices in bounds:', {
        rowInBounds,
        colInBounds,
        herefordIndex,
        bangorIndex
      });
      
      expect(rowInBounds).toBe(true);
      expect(colInBounds).toBe(true);
      
      // Get the actual matrix value
      const matrixValue = payoffTableGB.matrix[herefordIndex][bangorIndex];
      console.log('Matrix value at [', herefordIndex, '][', bangorIndex, ']:', matrixValue);
      
      // Test the findPayout function
      const functionValue = boxcarsGB.findPayout(hereford.id, bangor.id);
      console.log('findPayout(', hereford.id, ',', bangor.id, '):', functionValue);
      
      // Both should return 8
      expect(matrixValue).toBe(8);
      expect(functionValue).toBe(8);
      
      console.log('=== DEBUG: Test Results ===');
      console.log('Matrix lookup passed:', matrixValue === 8);
      console.log('Function lookup passed:', functionValue === 8);
    });

    test('should verify matrix row for Hereford', () => {
      const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
      const herefordIndex = hereford.id - 1;
      
      console.log('=== DEBUG: Hereford Matrix Row ===');
      console.log('Hereford index:', herefordIndex);
      
      if (herefordIndex >= 0 && herefordIndex < payoffTableGB.matrix.length) {
        const row = payoffTableGB.matrix[herefordIndex];
        console.log('Row length:', row.length);
        console.log('Row values (first 20):', row.slice(0, 20));
        
        // Check the specific value at Bangor's index
        const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
        const bangorIndex = bangor.id - 1;
        console.log('Bangor index:', bangorIndex);
        console.log('Value at Bangor index:', row[bangorIndex]);
        
        // Also check surrounding values for context
        const start = Math.max(0, bangorIndex - 2);
        const end = Math.min(row.length, bangorIndex + 3);
        console.log('Values around Bangor index [', start, '-', end, ']:', row.slice(start, end));
      } else {
        console.log('Hereford index out of bounds!');
      }
    });
  });
});

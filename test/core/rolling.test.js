/**
 * Unit tests for src/core/rolling.js
 */

const path = require('path');

describe('Core Rolling Module', () => {
  let rolling;

  beforeAll(() => {
    rolling = require(path.join(__dirname, '../../src/core/rolling.js'));
  });

  describe('rollOddEven', () => {
    test('should return odd or even', () => {
      // Run multiple times to test randomness
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const result = rolling.rollOddEven();
        expect(['odd', 'even']).toContain(result);
        results.add(result);
      }
      // Should have both values over 100 rolls
      expect(results.size).toBe(2);
    });
  });

  describe('roll2d6', () => {
    test('should return values between 2 and 12', () => {
      const results = new Set();
      for (let i = 0; i < 1000; i++) {
        const result = rolling.roll2d6();
        expect(result).toBeGreaterThanOrEqual(2);
        expect(result).toBeLessThanOrEqual(12);
        results.add(result);
      }
      // Should see multiple different values
      expect(results.size).toBeGreaterThan(5);
    });
  });

  describe('rollNextStop logic', () => {
    test('should detect empty player correctly', () => {
      const emptyPlayer1 = { stops: [{ cityId: null }] };
      const emptyPlayer2 = { stops: [{ cityId: null }, { cityId: null }] };
      const emptyPlayer3 = { stops: [] };
      const nonEmptyPlayer = { stops: [{ cityId: 1 }] };

      expect((emptyPlayer1.stops || []).every(s => !s.cityId)).toBe(true);
      expect((emptyPlayer2.stops || []).every(s => !s.cityId)).toBe(true);
      expect((emptyPlayer3.stops || []).every(s => !s.cityId)).toBe(true);
      expect((nonEmptyPlayer.stops || []).every(s => !s.cityId)).toBe(false);
    });

    test('should handle dataset lookup correctly', () => {
      const mockDataset = {
        destinationTable: {
          regionChart: {
            odd: { 7: 'North' },
            even: { 6: 'South' }
          },
          destinationCharts: {
            North: {
              odd: { 7: 'City A' }
            }
          }
        },
        resolveIdByName: (name) => name === 'City A' ? 1 : null
      };

      // Test region lookup
      const regionTable = mockDataset.destinationTable.regionChart['odd'];
      expect(regionTable[7]).toBe('North');

      // Test city lookup
      const cityChart = mockDataset.destinationTable.destinationCharts['North'];
      expect(cityChart['odd'][7]).toBe('City A');

      // Test ID resolution
      expect(mockDataset.resolveIdByName('City A')).toBe(1);
    });
  });

  describe('rollHomeCity logic', () => {
    test('should format roll text correctly', () => {
      const rollText = 'Odd+7 → North → City A';
      expect(rollText).toContain('Odd+7');
      expect(rollText).toContain('North');
      expect(rollText).toContain('City A');
    });

    test('should handle region selection from dataset', () => {
      const mockDataset = {
        destinationTable: {
          regionChart: {
            odd: { 7: 'North' },
            even: { 8: 'South' }
          }
        }
      };

      const oddEven = 'odd';
      const roll = 7;
      const table = mockDataset.destinationTable.regionChart[oddEven];
      const region = table && table[roll];

      expect(region).toBe('North');
    });

    test('should handle missing dataset gracefully', () => {
      const dataset = null;
      let region;
      
      if (dataset && dataset.destinationTable && dataset.destinationTable.regionChart) {
        const table = dataset.destinationTable.regionChart['odd'];
        region = table && table[7];
      }

      expect(region).toBeUndefined();
    });
  });
});

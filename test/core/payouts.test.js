/**
 * Unit tests for src/core/payouts.js
 */

const path = require('path');

describe('Core Payouts Module', () => {
  let payouts;

  beforeAll(() => {
    // Load the payouts module
    payouts = require(path.join(__dirname, '../../src/core/payouts.js'));
  });

  describe('computePayout', () => {
    const mockFindPayout = (a, b) => {
      if (a === 1 && b === 2) return 500;
      if (a === 2 && b === 1) return 500;
      if (a === 1 && b === 1) return 0;
      return undefined;
    };

    test('should return null for missing cities', () => {
      expect(payouts.computePayout(mockFindPayout, null, 2)).toBeNull();
      expect(payouts.computePayout(mockFindPayout, 1, null)).toBeNull();
      expect(payouts.computePayout(mockFindPayout, null, null)).toBeNull();
    });

    test('should return null for invalid findPayout function', () => {
      expect(payouts.computePayout(null, 1, 2)).toBeNull();
      expect(payouts.computePayout(undefined, 1, 2)).toBeNull();
      expect(payouts.computePayout('not a function', 1, 2)).toBeNull();
    });

    test('should return payout amount for valid cities', () => {
      expect(payouts.computePayout(mockFindPayout, 1, 2)).toBe(500);
      expect(payouts.computePayout(mockFindPayout, 2, 1)).toBe(500);
    });

    test('should return null when findPayout returns undefined', () => {
      expect(payouts.computePayout(mockFindPayout, 3, 4)).toBeNull();
    });

    test('should return null when findPayout returns non-number', () => {
      const badFindPayout = () => 'not a number';
      expect(payouts.computePayout(badFindPayout, 1, 2)).toBeNull();
    });

    test('should handle zero payout', () => {
      expect(payouts.computePayout(mockFindPayout, 1, 1)).toBe(0);
    });
  });

  describe('recomputeAllPayouts', () => {
    const mockFindPayout = (a, b) => {
      if (a === 1 && b === 2) return 100;
      if (a === 2 && b === 3) return 200;
      if (a === 3 && b === 4) return 300;
      return 0;
    };

    test('should recompute payouts for all stops in order', () => {
      const player = {
        stops: [
          { cityId: 4, payoutFromPrev: null }, // newest stop
          { cityId: 3, payoutFromPrev: null },
          { cityId: 2, payoutFromPrev: null },
          { cityId: 1, payoutFromPrev: null }  // oldest stop
        ]
      };

      payouts.recomputeAllPayouts(player, mockFindPayout);

      // Payouts should be computed from previous stop (next in array)
      expect(player.stops[0].payoutFromPrev).toBe(300); // 4 from 3
      expect(player.stops[1].payoutFromPrev).toBe(200); // 3 from 2  
      expect(player.stops[2].payoutFromPrev).toBe(100); // 2 from 1
      expect(player.stops[3].payoutFromPrev).toBeNull(); // 1 from nothing
    });

    test('should handle stops with null cityId', () => {
      const player = {
        stops: [
          { cityId: 2, payoutFromPrev: null },
          { cityId: null, payoutFromPrev: null },
          { cityId: 1, payoutFromPrev: null }
        ]
      };

      payouts.recomputeAllPayouts(player, mockFindPayout);

      expect(player.stops[0].payoutFromPrev).toBeNull(); // 2 from null
      expect(player.stops[1].payoutFromPrev).toBeNull(); // null from 1
      expect(player.stops[2].payoutFromPrev).toBeNull(); // 1 from nothing
    });

    test('should handle empty stops array', () => {
      const player = { stops: [] };
      
      expect(() => {
        payouts.recomputeAllPayouts(player, mockFindPayout);
      }).not.toThrow();
    });

    test('should handle missing stops property', () => {
      const player = {};
      
      expect(() => {
        payouts.recomputeAllPayouts(player, mockFindPayout);
      }).not.toThrow();
    });

    test('should handle single stop', () => {
      const player = {
        stops: [{ cityId: 1, payoutFromPrev: null }]
      };

      payouts.recomputeAllPayouts(player, mockFindPayout);

      expect(player.stops[0].payoutFromPrev).toBeNull();
    });
  });
});

/**
 * Unit tests for src/core/stats.js
 */

const path = require('path');

describe('Core Stats Module', () => {
  let stats;

  beforeAll(() => {
    stats = require(path.join(__dirname, '../../src/core/stats.js'));
  });

  describe('computeStats', () => {
    test('should compute stats for single player', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 3, payoutFromPrev: 200, unreachable: false },
              { cityId: 2, payoutFromPrev: 150, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false } // home city
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual({
        playerId: 'p1',
        name: 'Player 1',
        legsCount: 2, // 2 legs with payouts
        totalPayout: 350, // 200 + 150
        uniqueCities: 3 // 3 different cities
      });

      expect(result.totals).toEqual({
        legsCount: 2,
        totalPayout: 350,
        uniqueCities: 3
      });
    });

    test('should exclude unreachable legs when includeUnreachable is false', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 3, payoutFromPrev: 200, unreachable: true },  // excluded
              { cityId: 2, payoutFromPrev: 150, unreachable: false }, // included
              { cityId: 1, payoutFromPrev: null, unreachable: false } // home city
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows[0].legsCount).toBe(1);
      expect(result.rows[0].totalPayout).toBe(150);
    });

    test('should include unreachable legs when includeUnreachable is true', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 3, payoutFromPrev: 200, unreachable: true },  // included
              { cityId: 2, payoutFromPrev: 150, unreachable: false }, // included
              { cityId: 1, payoutFromPrev: null, unreachable: false } // home city
            ]
          }
        ]
      };

      const result = stats.computeStats(state, true);

      expect(result.rows[0].legsCount).toBe(2);
      expect(result.rows[0].totalPayout).toBe(350);
    });

    test('should handle multiple players', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 2, payoutFromPrev: 100, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          },
          {
            id: 'p2',
            name: 'Player 2',
            stops: [
              { cityId: 4, payoutFromPrev: 200, unreachable: false },
              { cityId: 3, payoutFromPrev: 150, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows).toHaveLength(2);
      expect(result.totals).toEqual({
        legsCount: 3, // 1 + 2
        totalPayout: 450, // 100 + 350
        uniqueCities: 5 // sum across players (not globally unique)
      });
    });

    test('should handle stops with null cityIds', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: null, payoutFromPrev: 100, unreachable: false }, // excluded
              { cityId: 2, payoutFromPrev: 150, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows[0].legsCount).toBe(1); // only one valid leg
      expect(result.rows[0].uniqueCities).toBe(2); // null filtered out
    });

    test('should handle stops with null payouts', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 2, payoutFromPrev: null, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows[0].totalPayout).toBe(0);
    });

    test('should exclude last stop from leg count', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 1, payoutFromPrev: 100, unreachable: false } // last stop
            ]
          }
        ]
      };

      const result = stats.computeStats(state, false);

      expect(result.rows[0].legsCount).toBe(0); // last stop has no legs
    });

    test('should handle empty players array', () => {
      const state = { players: [] };

      const result = stats.computeStats(state, false);

      expect(result.rows).toEqual([]);
      expect(result.totals).toEqual({
        legsCount: 0,
        totalPayout: 0,
        uniqueCities: 0
      });
    });
  });

  describe('buildCSV', () => {
    test('should generate CSV with header and data rows', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player 1',
            stops: [
              { cityId: 2, payoutFromPrev: 100, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          },
          {
            id: 'p2',
            name: 'Player "Two"', // Test escaping
            stops: [
              { cityId: 3, payoutFromPrev: 200, unreachable: false },
              { cityId: 1, payoutFromPrev: null, unreachable: false }
            ]
          }
        ]
      };

      const csv = stats.buildCSV(state, false);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Player,Completed legs,Total payouts,Unique cities');
      expect(lines[1]).toBe('Player 1,1,100,2');
      expect(lines[2]).toBe('"Player ""Two""",1,200,2'); // Quoted and escaped
      expect(lines).toHaveLength(3);
    });

    test('should handle empty players', () => {
      const state = { players: [] };

      const csv = stats.buildCSV(state, false);

      expect(csv).toBe('Player,Completed legs,Total payouts,Unique cities');
    });

    test('should escape special characters in names', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: 'Player, with comma',
            stops: [{ cityId: 1, payoutFromPrev: null, unreachable: false }]
          },
          {
            id: 'p2',
            name: 'Player\nwith newline',
            stops: [{ cityId: 1, payoutFromPrev: null, unreachable: false }]
          }
        ]
      };

      const csv = stats.buildCSV(state, false);
      const lines = csv.split('\n');

      expect(lines[1]).toBe('"Player, with comma",0,0,1');
      expect(lines[2]).toBe('"Player\nwith newline",0,0,1');
    });

    test('should handle null and undefined names', () => {
      const state = {
        players: [
          {
            id: 'p1',
            name: null,
            stops: [{ cityId: 1, payoutFromPrev: null, unreachable: false }]
          },
          {
            id: 'p2',
            name: undefined,
            stops: [{ cityId: 1, payoutFromPrev: null, unreachable: false }]
          }
        ]
      };

      const csv = stats.buildCSV(state, false);
      const lines = csv.split('\n');

      expect(lines[1]).toBe(',0,0,1'); // null becomes empty
      expect(lines[2]).toBe(',0,0,1'); // undefined becomes empty
    });
  });
});

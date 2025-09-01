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

  describe('rollNextStop', () => {
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        map: 'US',
        idToCity: new Map([
          [1, { id: 1, name: 'City A', region: 'North' }],
          [2, { id: 2, name: 'City B', region: 'South' }]
        ]),
        chooseRegion: jest.fn().mockResolvedValue('North'),
        chooseHomeCity: jest.fn().mockResolvedValue(1),
        rngOddEven: jest.fn().mockReturnValue('odd'),
        rng2d6: jest.fn().mockReturnValue(7),
        dataset: {
          destinationTable: {
            regionChart: {
              odd: { 7: 'North' }
            },
            destinationCharts: {
              North: {
                odd: { 7: 'City A' }
              }
            }
          },
          resolveIdByName: jest.fn().mockReturnValue(1)
        },
        defaultStop: jest.fn().mockReturnValue({ cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' }),
        recomputeAllPayouts: jest.fn(),
        saveState: jest.fn(),
        render: jest.fn()
      };
    });

    test('should call rollHomeCity for empty player', async () => {
      const player = {
        stops: [{ cityId: null }] // no cities set
      };

      const rollHomeCitySpy = jest.spyOn(rolling, 'rollHomeCity').mockResolvedValue();

      await rolling.rollNextStop(player, mockCtx);

      expect(rollHomeCitySpy).toHaveBeenCalledWith(player, mockCtx);
      rollHomeCitySpy.mockRestore();
    });

    test('should roll destination for player with home city', async () => {
      const player = {
        stops: [{ cityId: 1 }] // has home city
      };

      // Mock RB.derived.getCurrentRegion since rolling.js uses it
      global.RB = {
        derived: {
          getCurrentRegion: jest.fn().mockReturnValue('South')
        }
      };

      await rolling.rollNextStop(player, mockCtx);

      expect(mockCtx.rngOddEven).toHaveBeenCalledTimes(2); // region + city
      expect(mockCtx.rng2d6).toHaveBeenCalledTimes(2); // region + city
      expect(mockCtx.dataset.resolveIdByName).toHaveBeenCalledWith('City A');
      expect(mockCtx.defaultStop).toHaveBeenCalled();
      expect(player.stops).toHaveLength(2); // new stop added
      expect(mockCtx.recomputeAllPayouts).toHaveBeenCalledWith(player);
      expect(mockCtx.saveState).toHaveBeenCalled();
      expect(mockCtx.render).toHaveBeenCalled();

      // Clean up
      delete global.RB;
    });

    test('should choose different region if rolled same as current', async () => {
      const player = {
        stops: [{ cityId: 1 }] // in North region
      };

      // Mock RB.derived.getCurrentRegion to return same region as rolled
      global.RB = {
        derived: {
          getCurrentRegion: jest.fn().mockReturnValue('North') // same as rolled
        }
      };

      await rolling.rollNextStop(player, mockCtx);

      expect(mockCtx.chooseRegion).toHaveBeenCalledWith('North');

      // Clean up
      delete global.RB;
    });

    test('should handle missing dataset gracefully', async () => {
      const player = {
        stops: [{ cityId: 1 }]
      };

      const ctxWithoutDataset = { ...mockCtx, dataset: null };

      global.RB = {
        derived: {
          getCurrentRegion: jest.fn().mockReturnValue(null)
        }
      };

      await expect(rolling.rollNextStop(player, ctxWithoutDataset)).resolves.not.toThrow();

      // Clean up
      delete global.RB;
    });
  });

  describe('rollHomeCity', () => {
    let mockCtx;

    beforeEach(() => {
      mockCtx = {
        map: 'US',
        idToCity: new Map([
          [1, { id: 1, name: 'City A', region: 'North' }]
        ]),
        chooseHomeCity: jest.fn().mockResolvedValue(1),
        rngOddEven: jest.fn().mockReturnValue('odd'),
        rng2d6: jest.fn().mockReturnValue(7),
        dataset: {
          destinationTable: {
            regionChart: {
              odd: { 7: 'North' }
            }
          }
        },
        recomputeAllPayouts: jest.fn(),
        saveState: jest.fn(),
        render: jest.fn()
      };
    });

    test('should roll region and choose home city', async () => {
      const player = {
        stops: [{ cityId: null, lastRollText: '' }]
      };

      await rolling.rollHomeCity(player, mockCtx);

      expect(mockCtx.rngOddEven).toHaveBeenCalled();
      expect(mockCtx.rng2d6).toHaveBeenCalled();
      expect(mockCtx.chooseHomeCity).toHaveBeenCalledWith('North');
      expect(player.stops[0].cityId).toBe(1);
      expect(player.stops[0].lastRollText).toContain('Odd+7 → North → City A');
      expect(mockCtx.recomputeAllPayouts).toHaveBeenCalledWith(player);
      expect(mockCtx.saveState).toHaveBeenCalled();
      expect(mockCtx.render).toHaveBeenCalled();
    });

    test('should handle user canceling home city selection', async () => {
      const player = {
        stops: [{ cityId: null, lastRollText: '' }]
      };

      mockCtx.chooseHomeCity.mockResolvedValue(null); // user canceled

      await rolling.rollHomeCity(player, mockCtx);

      expect(player.stops[0].cityId).toBeNull(); // no change
      expect(mockCtx.recomputeAllPayouts).not.toHaveBeenCalled();
      expect(mockCtx.saveState).not.toHaveBeenCalled();
      expect(mockCtx.render).not.toHaveBeenCalled();
    });

    test('should handle missing dataset gracefully', async () => {
      const player = {
        stops: [{ cityId: null, lastRollText: '' }]
      };

      const ctxWithoutDataset = { ...mockCtx, dataset: null };

      await expect(rolling.rollHomeCity(player, ctxWithoutDataset)).resolves.not.toThrow();

      expect(mockCtx.chooseHomeCity).toHaveBeenCalledWith(undefined);
    });
  });
});

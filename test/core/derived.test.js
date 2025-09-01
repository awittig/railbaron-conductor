/**
 * Unit tests for src/core/derived.js
 */

const path = require('path');

describe('Core Derived Module', () => {
  let derived;

  beforeAll(() => {
    derived = require(path.join(__dirname, '../../src/core/derived.js'));
  });

  describe('getCurrentRegion', () => {
    const mockIdToCity = new Map([
      [1, { id: 1, name: 'City A', region: 'North' }],
      [2, { id: 2, name: 'City B', region: 'South' }],
      [3, { id: 3, name: 'City C', region: 'East' }]
    ]);

    test('should return region of latest stop with cityId', () => {
      const player = {
        stops: [
          { cityId: 2 }, // newest stop
          { cityId: 1 },
          { cityId: 3 }  // oldest stop
        ]
      };

      expect(derived.getCurrentRegion(player, mockIdToCity)).toBe('South');
    });

    test('should skip stops with null cityId', () => {
      const player = {
        stops: [
          { cityId: null }, // newest stop is null
          { cityId: 1 },    // this should be returned
          { cityId: 3 }
        ]
      };

      expect(derived.getCurrentRegion(player, mockIdToCity)).toBe('North');
    });

    test('should return null if no stops have cityId', () => {
      const player = {
        stops: [
          { cityId: null },
          { cityId: null }
        ]
      };

      expect(derived.getCurrentRegion(player, mockIdToCity)).toBeNull();
    });

    test('should return null if stops array is empty', () => {
      const player = { stops: [] };
      expect(derived.getCurrentRegion(player, mockIdToCity)).toBeNull();
    });

    test('should return null if stops property is missing', () => {
      const player = {};
      expect(derived.getCurrentRegion(player, mockIdToCity)).toBeNull();
    });

    test('should return null if city not found in map', () => {
      const player = {
        stops: [{ cityId: 999 }] // City not in map
      };

      expect(derived.getCurrentRegion(player, mockIdToCity)).toBeNull();
    });

    test('should return null if idToCity is null', () => {
      const player = {
        stops: [{ cityId: 1 }]
      };

      expect(derived.getCurrentRegion(player, null)).toBeNull();
    });

    test('should handle city with null region', () => {
      const mapWithNullRegion = new Map([
        [1, { id: 1, name: 'City A', region: null }]
      ]);
      
      const player = {
        stops: [{ cityId: 1 }]
      };

      expect(derived.getCurrentRegion(player, mapWithNullRegion)).toBeNull();
    });
  });

  describe('updateDerivedFields', () => {
    test('should update visitedCityIds with all non-null cityIds', () => {
      const player = {
        stops: [
          { cityId: 3 },
          { cityId: null },
          { cityId: 1 },
          { cityId: 2 }
        ]
      };

      derived.updateDerivedFields(player);

      expect(player.visitedCityIds).toEqual([3, 1, 2]);
    });

    test('should update homeCityId to the oldest stop with cityId', () => {
      const player = {
        stops: [
          { cityId: 3 }, // newest
          { cityId: null },
          { cityId: 1 },
          { cityId: 2 }  // oldest with cityId
        ]
      };

      derived.updateDerivedFields(player);

      expect(player.homeCityId).toBe(2);
    });

    test('should set homeCityId to null if no stops have cityId', () => {
      const player = {
        stops: [
          { cityId: null },
          { cityId: null }
        ]
      };

      derived.updateDerivedFields(player);

      expect(player.homeCityId).toBeNull();
      expect(player.visitedCityIds).toEqual([]);
    });

    test('should handle empty stops array', () => {
      const player = { stops: [] };

      derived.updateDerivedFields(player);

      expect(player.visitedCityIds).toEqual([]);
      expect(player.homeCityId).toBeNull();
    });

    test('should handle missing stops property', () => {
      const player = {};

      derived.updateDerivedFields(player);

      expect(player.visitedCityIds).toEqual([]);
      expect(player.homeCityId).toBeNull();
    });

    test('should handle single stop', () => {
      const player = {
        stops: [{ cityId: 5 }]
      };

      derived.updateDerivedFields(player);

      expect(player.visitedCityIds).toEqual([5]);
      expect(player.homeCityId).toBe(5);
    });

    test('should filter out falsy cityIds', () => {
      const player = {
        stops: [
          { cityId: 1 },
          { cityId: 0 },      // falsy
          { cityId: null },   // falsy
          { cityId: undefined }, // falsy
          { cityId: 2 }
        ]
      };

      derived.updateDerivedFields(player);

      expect(player.visitedCityIds).toEqual([1, 2]);
      expect(player.homeCityId).toBe(2); // last truthy cityId
    });
  });
});

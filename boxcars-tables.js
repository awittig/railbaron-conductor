/*
  Boxcars/Rail Baron roll helpers and region/city groupings.
  Note: Uses deterministic mapping for city selection per (odd/even, 2d6) within a region.
*/

(function() {
  const REGIONS = [
    "Northeast",
    "North Central",
    "Southeast",
    "South Central",
    "Plains",
    "Northwest",
    "Southwest",
  ];

  // Region selection table: odd/even + 2..12
  // This distributes results across the seven regions in a balanced fashion.
  const REGION_ROLL_TABLE = {
    odd: {
      2: "Northeast",
      3: "Northeast",
      4: "North Central",
      5: "Southeast",
      6: "South Central",
      7: "Plains",
      8: "Northwest",
      9: "Southwest",
      10: "North Central",
      11: "Southeast",
      12: "Northeast",
    },
    even: {
      2: "North Central",
      3: "Southeast",
      4: "South Central",
      5: "Plains",
      6: "Northwest",
      7: "Southwest",
      8: "Northeast",
      9: "North Central",
      10: "Southeast",
      11: "Plains",
      12: "Southwest",
    },
  };

  // City groups by region using ids from payouts.js `cities` list
  const CITY_IDS_BY_REGION = {
    "Northeast": [
      1, 3, 6, 7, 15, 16, 20, 40, 45, 47, 49, 54, 67, 41
    ],
    "North Central": [
      13, 14, 20, 25, 27, 35, 36, 63, 64, 19, 44
    ],
    "Southeast": [
      2, 5, 10, 11, 12, 26, 28, 30, 32, 33, 34, 37, 38, 39, 54, 65
    ],
    "South Central": [
      17, 23, 24, 30, 33, 57, 61, 43
    ],
    "Plains": [
      4, 9, 18, 19, 22, 27, 44, 51, 52
    ],
    "Northwest": [
      8, 48, 50, 55, 56, 60, 62
    ],
    "Southwest": [
      21, 29, 31, 42, 46, 53, 58, 59, 56, 66
    ],
  };

  function oddEven() {
    return Math.random() < 0.5 ? "odd" : "even";
  }

  function roll2d6() {
    return (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
  }

  function mapRegion(oddEvenStr, sum2d6) {
    const table = REGION_ROLL_TABLE[oddEvenStr];
    return table && table[sum2d6];
  }

  function pickCityDeterministic(regionName, oddEvenStr, sum2d6) {
    const list = CITY_IDS_BY_REGION[regionName] || [];
    if (list.length === 0) return null;
    const indexKey = (oddEvenStr === "odd" ? 0 : 11) + (sum2d6 - 2);
    const idx = indexKey % list.length;
    return list[idx];
  }

  // Export globals
  window.BOXCARS = {
    REGIONS,
    REGION_ROLL_TABLE,
    CITY_IDS_BY_REGION,
    rollOddEven: oddEven,
    roll2d6,
    mapRegion,
    pickCityDeterministic,
  };
})();



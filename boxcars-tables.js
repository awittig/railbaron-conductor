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

  const destinationTable = {
    regionChart: {
      odd: {
        2: "Plains",
        3: "Southeast",
        4: "Southeast",
        5: "Southeast",
        6: "North Central",
        7: "North Central",
        8: "Northeast",
        9: "Northeast",
        10: "Northeast",
        11: "Southeast",
        12: "Northeast"
      },
      even: {
        2: "Southwest",
        3: "South Central",
        4: "South Central",
        5: "South Central",
        6: "Southwest",
        7: "Southwest",
        8: "Plains",
        9: "Northwest",
        10: "Northwest",
        11: "Plains",
        12: "Northwest"
      }
    },
    destinationCharts: {
      "South Central": {
        odd: {
          2: "Memphis",
          3: "Memphis",
          4: "Memphis",
          5: "Little Rock",
          6: "New Orleans",
          7: "Birmingham",
          8: "Louisville",
          9: "Nashville",
          10: "Nashville",
          11: "Louisville",
          12: "Memphis"
        },
        even: {
          2: "Shreveport",
          3: "Shreveport",
          4: "Dallas",
          5: "New Orleans",
          6: "Dallas",
          7: "San Antonio",
          8: "Houston",
          9: "Houston",
          10: "Fort Worth",
          11: "Fort Worth",
          12: "Fort Worth"
        }
      },
      "Northeast": {
        odd: {
          2: "New York",
          3: "New York",
          4: "New York",
          5: "Albany",
          6: "Boston",
          7: "Buffalo",
          8: "Boston",
          9: "Portland",
          10: "New York",
          11: "New York",
          12: "New York"
        },
        even: {
          2: "New York",
          3: "Washington",
          4: "Pittsburgh",
          5: "Pittsburgh",
          6: "Philadelphia",
          7: "Washington",
          8: "Philadelphia",
          9: "Baltimore",
          10: "Baltimore",
          11: "Baltimore",
          12: "New York"
        }
      },
      "Plains": {
        odd: {
          2: "Kansas City",
          3: "Kansas City",
          4: "Denver",
          5: "Denver",
          6: "Denver",
          7: "Kansas City",
          8: "Kansas City",
          9: "Kansas City",
          10: "Pueblo",
          11: "Pueblo",
          12: "Oklahoma City"
        },
        even: {
          2: "Oklahoma City",
          3: "St. Paul",
          4: "Minneapolis",
          5: "St. Paul",
          6: "Minneapolis",
          7: "Oklahoma City",
          8: "Des Moines",
          9: "Omaha",
          10: "Omaha",
          11: "Fargo",
          12: "Fargo"
        }
      },
      "Southeast": {
        odd: {
          2: "Charlotte",
          3: "Charlotte",
          4: "Chattanooga",
          5: "Atlanta",
          6: "Atlanta",
          7: "Atlanta",
          8: "Richmond",
          9: "Knoxville",
          10: "Mobile",
          11: "Knoxville",
          12: "Mobile"
        },
        even: {
          2: "Norfolk",
          3: "Norfolk",
          4: "Norfolk",
          5: "Charleston",
          6: "Miami",
          7: "Jacksonville",
          8: "Miami",
          9: "Tampa",
          10: "Tampa",
          11: "Mobile",
          12: "Norfolk"
        }
      },
      "North Central": {
        odd: {
          2: "Cleveland",
          3: "Cleveland",
          4: "Cleveland",
          5: "Cleveland",
          6: "Detroit",
          7: "Detroit",
          8: "Indianapolis",
          9: "Milwaukee",
          10: "Milwaukee",
          11: "Chicago",
          12: "Milwaukee"
        },
        even: {
          2: "Cincinnati",
          3: "Chicago",
          4: "Cincinnati",
          5: "Cincinnati",
          6: "Columbus",
          7: "Chicago",
          8: "Chicago",
          9: "St. Louis",
          10: "St. Louis",
          11: "St. Louis",
          12: "Chicago"
        }
      },
      "Northwest": {
        odd: {
          2: "Spokane",
          3: "Spokane",
          4: "Seattle",
          5: "Seattle",
          6: "Seattle",
          7: "Seattle",
          8: "Rapid City",
          9: "Casper",
          10: "Billings",
          11: "Billings",
          12: "Spokane"
        },
        even: {
          2: "Spokane",
          3: "Salt Lake City",
          4: "Salt Lake City",
          5: "Salt Lake City",
          6: "Portland",
          7: "Portland",
          8: "Portland",
          9: "Pocatello",
          10: "Butte",
          11: "Butte",
          12: "Portland"
        }
      },
      "Southwest": {
        odd: {
          2: "San Diego",
          3: "San Diego",
          4: "Reno",
          5: "San Diego",
          6: "Sacramento",
          7: "Las Vegas",
          8: "Phoenix",
          9: "El Paso",
          10: "Tucumcari",
          11: "Phoenix",
          12: "Phoenix"
        },
        even: {
          2: "Los Angeles",
          3: "Oakland",
          4: "Oakland",
          5: "Oakland",
          6: "Los Angeles",
          7: "Los Angeles",
          8: "Los Angeles",
          9: "San Francisco",
          10: "San Francisco",
          11: "San Francisco",
          12: "San Francisco"
        }
      }
    }
  };
  




  function oddEven() {
    return Math.random() < 0.5 ? "odd" : "even";
  }

  function roll2d6() {
    return (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
  }

  // Build name → id map using global cities list from payouts.js
  const NAME_TO_ID = (() => {
    const map = new Map();
    if (typeof window !== 'undefined' && Array.isArray(window.cities)) {
      window.cities.forEach((c) => {
        map.set(String(c.name).toLowerCase(), c.id);
      });
    }
    return map;
  })();

  function resolveCityIdFromName(regionName, cityName) {
    if (!cityName) return null;
    const key = cityName.toLowerCase();

    // Disambiguate Portland by region
    if (key === 'portland') {
      const specific = regionName === 'Northeast' ? 'portland, me' : 'portland, or';
      return NAME_TO_ID.get(specific) || null;
    }

    // Common alias corrections
    const aliasMap = new Map([
      ['cincinnati', 'cincinnatti'],
    ]);
    const corrected = aliasMap.get(key);

    const direct = NAME_TO_ID.get(key);
    if (direct) return direct;
    if (corrected) return NAME_TO_ID.get(corrected) || null;
    return null;
  }

  function mapRegion(oddEvenStr, sum2d6) {
    const table = destinationTable.regionChart[oddEvenStr];
    return table && table[sum2d6];
  }

  function pickCityByTable(regionName, oddEvenStr, sum2d6) {
    const regionChart = destinationTable.destinationCharts[regionName];
    if (!regionChart) return null;
    const cityName = regionChart[oddEvenStr]?.[sum2d6];
    const id = resolveCityIdFromName(regionName, cityName);
    return id;
  }

  function getCityByTable(regionName, oddEvenStr, sum2d6) {
    const regionChart = destinationTable.destinationCharts[regionName];
    if (!regionChart) return { id: null, name: null };
    const cityName = regionChart[oddEvenStr]?.[sum2d6] || null;
    const id = resolveCityIdFromName(regionName, cityName);
    return { id, name: cityName };
  }

  // Export globals
  window.BOXCARS = {
    REGIONS,
    REGION_ROLL_TABLE,
    CITY_IDS_BY_REGION,
    destinationTable,
    rollOddEven: oddEven,
    roll2d6,
    mapRegion,
    pickCityByTable,
    getCityByTable,
  };
})();



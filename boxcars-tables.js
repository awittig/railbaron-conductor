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

  // Region selection uses destinationTable.regionChart (official table)

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

  // Function to derive city IDs by region from destinationTable
  function deriveCityIdsByRegion() {
    const cityIdsByRegion = {};
    
    // Initialize empty arrays for each region
    REGIONS.forEach(region => {
      cityIdsByRegion[region] = [];
    });
    
    // Extract all unique city names from destinationTable and map them to their regions
    Object.entries(destinationTable.destinationCharts).forEach(([regionName, charts]) => {
      Object.values(charts).forEach(rollTable => {
        Object.values(rollTable).forEach(cityName => {
          if (cityName) {
            const cityId = resolveCityIdFromName(regionName, cityName);
            if (cityId !== null && !cityIdsByRegion[regionName].includes(cityId)) {
              cityIdsByRegion[regionName].push(cityId);
            }
          }
        });
      });
    });
    
    // Sort city IDs numerically for each region
    Object.values(cityIdsByRegion).forEach(cityIds => {
      cityIds.sort((a, b) => a - b);
    });
    
    return cityIdsByRegion;
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

  // Delegate US payouts to the canonical findPayout from payouts.js (if present)
  function findPayoutUS(a, b) {
    const us = (typeof window !== 'undefined' && window.BOXCARS_US) || (typeof global !== 'undefined' && global.BOXCARS_US);
    if (us && typeof us.findPayout === 'function') return us.findPayout(a, b);
    const fp = (typeof window !== 'undefined' && window.findPayout) || (typeof global !== 'undefined' && global.findPayout);
    return typeof fp === 'function' ? fp(a, b) : undefined;
  }

  // Export globals (both window and global for Node/Jest)
  const api = {
    REGIONS,
    CITY_IDS_BY_REGION: deriveCityIdsByRegion(),
    deriveCityIdsByRegion,
    destinationTable,
    rollOddEven: oddEven,
    roll2d6,
    mapRegion,
    pickCityByTable,
    getCityByTable,
    findPayout: findPayoutUS,
  };

  // Lazily resolve US CITIES from either generated dataset or legacy global 'cities'
  function resolveUSCities() {
    const w = (typeof window !== 'undefined') ? window : undefined;
    const g = (typeof global !== 'undefined') ? global : undefined;
    const src = (w && w.BOXCARS_US && w.BOXCARS_US.CITIES)
      || (g && g.BOXCARS_US && g.BOXCARS_US.CITIES)
      || (w && Array.isArray(w.cities) && w.cities)
      || (g && Array.isArray(g.cities) && g.cities)
      || [];
    return src;
  }
  try {
    Object.defineProperty(api, 'CITIES', { get: resolveUSCities, enumerable: true });
  } catch (_) {
    api.CITIES = resolveUSCities();
  }

  if (typeof window !== 'undefined') {
    window.BOXCARS = api;
  }
  if (typeof global !== 'undefined') {
    global.BOXCARS = api;
  }
})();



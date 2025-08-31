#!/usr/bin/env node

/*
  Export United States payouts into a name-keyed JSON structure from the current data.

  Sources:
  - payouts.js            (cities + pairwise payouts)
  - boxcars-tables.js     (US destination regions)

  Output: data/us-payouts.src.json
*/

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error('[export-us-payouts] ' + message);
  process.exit(1);
}

const vm = require('vm');

// Execute payouts.js in isolated context to obtain cities and findPayout
const payoutsCode = fs.readFileSync(path.join(__dirname, '..', 'payouts.js'), 'utf8');
const sandboxPayouts = { console };
vm.createContext(sandboxPayouts);
try {
  vm.runInContext(payoutsCode, sandboxPayouts, { filename: 'payouts.js' });
} catch (e) {
  fail('Failed to execute payouts.js: ' + e.message);
}
const citiesArr = sandboxPayouts.cities;
if (!Array.isArray(citiesArr) || citiesArr.length === 0) fail('cities missing or invalid in payouts.js');
const cities = citiesArr.map((c) => c.name);
const findPayout = sandboxPayouts.findPayout;
if (typeof findPayout !== 'function') fail('findPayout not found in payouts.js context');

// Build name->id map (1-based)
const nameToId = new Map(cities.map((n, i) => [n, i + 1]));

const N = cities.length;
const payoutsByName = {};
for (let i = 0; i < N; i++) {
  const fromName = cities[i];
  const row = {};
  for (let j = 0; j < N; j++) {
    if (i === j) continue;
    const toName = cities[j];
    const a = i + 1;
    const b = j + 1;
    const val = findPayout(a, b);
    if (!Number.isInteger(val) || val < 0) fail(`Invalid payout for ${fromName} -> ${toName}: ${val}`);
    row[toName] = val;
  }
  payoutsByName[fromName] = row;
}

// Execute boxcars-tables.js in a context where window.cities is available
const boxcarsCode = fs.readFileSync(path.join(__dirname, '..', 'boxcars-tables.js'), 'utf8');
const sandboxUS = { console, window: { cities: citiesArr } };
vm.createContext(sandboxUS);
try {
  vm.runInContext(boxcarsCode, sandboxUS, { filename: 'boxcars-tables.js' });
} catch (e) {
  fail('Failed to execute boxcars-tables.js: ' + e.message);
}
const BOXCARS = sandboxUS.window.BOXCARS;
if (!BOXCARS) fail('BOXCARS not produced by boxcars-tables.js');
const regionChart = BOXCARS.destinationTable.regionChart;
const destinationCharts = BOXCARS.destinationTable.destinationCharts;

// Compose unified source JSON
const out = {
  cities,
  payoutsByName,
  regions: {
    regionChart,
    destinationCharts
  },
  meta: {
    generatedAt: new Date().toISOString(),
    source: 'payouts.js + boxcars-tables.js',
    version: 1
  }
};

const outDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'us-payouts.src.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('[export-us-payouts] Wrote', path.relative(process.cwd(), outPath));



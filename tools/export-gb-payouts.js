#!/usr/bin/env node

/*
  Export Great Britain payouts into a name-keyed JSON structure from the current matrix.

  Output: data/gb-payouts.src.json
  Structure:
  {
    "cities": ["Aberdeen", "..."],
    "payoutsByName": { "Hereford": { "Bangor": 8, ... }, ... },
    "meta": { symmetric: true, generatedAt: ISOString, source: string, version: 1 }
  }
*/

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error('[export-gb-payouts] ' + message);
  process.exit(1);
}

// Load GB tables in a simulated browser-like global
global.window = {};
try {
  require(path.join(__dirname, '..', 'boxcars-britain-tables.js'));
} catch (e) {
  fail('Failed to load boxcars-britain-tables.js: ' + e.message);
}

const payoffTableGB = global.window.payoffTableGB;
const destTableGB = global.window.destinationTableGB;
const gb = global.window.BOXCARS_GB;
if (!payoffTableGB || !gb) {
  fail('GB tables not initialized. Expected window.payoffTableGB and window.BOXCARS_GB.');
}

const cities = Array.isArray(payoffTableGB.cities) ? payoffTableGB.cities.slice() : null;
const matrix = payoffTableGB.matrix;
if (!Array.isArray(cities) || cities.length === 0) fail('Invalid cities list.');
if (!Array.isArray(matrix) || matrix.length !== cities.length) fail('Matrix dimension mismatch.');

const size = cities.length;
for (let i = 0; i < size; i++) {
  if (!Array.isArray(matrix[i]) || matrix[i].length !== size) {
    fail('Row ' + i + ' length mismatch.');
  }
}

// Build name-keyed mapping
const payoutsByName = {};
for (let i = 0; i < size; i++) {
  const fromName = cities[i];
  const row = matrix[i];
  const rowMap = {};
  for (let j = 0; j < size; j++) {
    if (i === j) continue; // omit diagonal
    const toName = cities[j];
    const value = row[j];
    rowMap[toName] = value;
  }
  payoutsByName[fromName] = rowMap;
}

// Validate symmetry
let symmetric = true;
let asymCount = 0;
for (let i = 0; i < size; i++) {
  for (let j = i + 1; j < size; j++) {
    const a = matrix[i][j];
    const b = matrix[j][i];
    if (a !== b) { symmetric = false; asymCount++; }
  }
}

const out = {
  cities,
  payoutsByName,
  regions: destTableGB ? {
    regionChart: destTableGB.regionChart,
    destinationCharts: destTableGB.destinationCharts
  } : undefined,
  meta: {
    symmetric,
    asymmetricPairs: asymCount,
    generatedAt: new Date().toISOString(),
    source: 'boxcars-britain-tables.js',
    version: 1
  }
};

const outDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'gb-payouts.src.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('[export-gb-payouts] Wrote', path.relative(process.cwd(), outPath));



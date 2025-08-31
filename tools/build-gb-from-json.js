#!/usr/bin/env node

/*
  Build Great Britain payout matrix and helper exports from name-keyed JSON.

  Input:  data/gb-payouts.src.json (generated or maintained by humans)
  Output: generated/boxcars-britain-tables.generated.js

  Responsibilities:
  - Validate cities are unique
  - Validate shape and value constraints (diagonal 0, symmetry)
  - Allow spot checks (env var GB_CHECKS="Hereford:Bangor=8;Bangor:Hereford=8")
  - Generate a JS module mirroring the structure consumed by the app/tests
*/

const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error('[build-gb-from-json] ' + message);
  process.exit(1);
}

function readJson(fp) {
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); }
  catch (e) { fail('Failed to read ' + fp + ': ' + e.message); }
}

const srcPath = path.join(__dirname, '..', 'data', 'gb-payouts.src.json');
if (!fs.existsSync(srcPath)) fail('Missing input: ' + srcPath + '\nRun: npm run export:gb');
const src = readJson(srcPath);

const cities = src && Array.isArray(src.cities) ? src.cities : null;
const payoutsByName = src && src.payoutsByName && typeof src.payoutsByName === 'object' ? src.payoutsByName : null;
if (!cities || !payoutsByName) fail('Invalid source JSON structure.');

// Basic validations
const seen = new Set();
cities.forEach((n) => {
  const key = String(n);
  if (seen.has(key)) fail('Duplicate city name: ' + key);
  seen.add(key);
});

const nameToIndex = new Map(cities.map((n, i) => [n, i]));
const N = cities.length;
const matrix = Array.from({ length: N }, () => Array(N).fill(0));

for (const [from, row] of Object.entries(payoutsByName)) {
  const i = nameToIndex.get(from);
  if (typeof i !== 'number') fail('Unknown city in payoutsByName: ' + from);
  for (const [to, value] of Object.entries(row)) {
    const j = nameToIndex.get(to);
    if (typeof j !== 'number') fail(`Unknown destination "${to}" in row for ${from}`);
    if (!Number.isInteger(value) || value < 0) fail(`Invalid value ${value} for ${from} → ${to}`);
    matrix[i][j] = value;
    matrix[j][i] = value; // enforce symmetry
  }
}

// Validate diagonal is 0 and symmetry is consistent
let asymmetricPairs = 0;
for (let i = 0; i < N; i++) {
  if (matrix[i][i] !== 0) fail(`Diagonal must be 0 at ${i} (${cities[i]})`);
  for (let j = i + 1; j < N; j++) {
    if (matrix[i][j] !== matrix[j][i]) asymmetricPairs++;
  }
}
if (asymmetricPairs) fail('Asymmetry detected in matrix after build.');

// Optional spot checks via env var
const checksEnv = process.env.GB_CHECKS || '';
if (checksEnv) {
  const pairs = checksEnv.split(';').map((s) => s.trim()).filter(Boolean);
  for (const p of pairs) {
    const m = p.match(/^([^:]+):([^=]+)=(\d+)$/);
    if (!m) fail('Invalid check syntax: ' + p);
    const [, a, b, v] = m;
    const i = nameToIndex.get(a);
    const j = nameToIndex.get(b);
    if (typeof i !== 'number' || typeof j !== 'number') fail('Unknown city in check: ' + p);
    const expected = Number(v);
    const actual = matrix[i][j];
    if (actual !== expected) fail(`Check failed: ${a} → ${b} expected ${expected} got ${actual}`);
  }
}

// Generate JS module consumed by the app/tests (same public shape)
const outDir = path.join(__dirname, '..', 'generated');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'boxcars-britain-tables.generated.js');

function jsString(s) { return JSON.stringify(s); }

const banner = `/* AUTO-GENERATED FILE - DO NOT EDIT.
   Source: data/gb-payouts.src.json
   Generated: ${new Date().toISOString()}
*/`;

const js = `${banner}
(function(){
  const payoffTableGB = {
    cities: ${JSON.stringify(cities)},
    matrix: ${JSON.stringify(matrix)}
  };
  if (typeof window !== 'undefined') {
    window.payoffTableGB = payoffTableGB;
  }

  (function(){
    const CITIES = payoffTableGB.cities.map((name, idx) => ({ id: idx + 1, name }));
    const NAME_TO_ID = new Map();
    function normalizeName(s) { return String(s).toLowerCase().trim().replace(/[’']/g, "'").replace(/\"\"/g, '"').replace(/\s+/g, ' '); }
    for (const c of CITIES) NAME_TO_ID.set(normalizeName(c.name), c.id);
    function resolveIdByName(name) { if (!name) return null; return NAME_TO_ID.get(normalizeName(name)) || null; }
    function findPayoutGB(a,b){ if(!a||!b) return undefined; const i=a-1, j=b-1; const m=payoffTableGB.matrix; if(!m||!m[i]||typeof m[i][j]==='undefined') return undefined; return m[i][j]; }
    if (typeof window !== 'undefined') {
      window.BOXCARS_GB = {
        CITIES,
        CITY_IDS_BY_REGION: {},
        findPayout: findPayoutGB,
        resolveIdByName,
        REGIONS: []
      };
    }
  })();
})();
`;

fs.writeFileSync(outPath, js, 'utf8');
console.log('[build-gb-from-json] Wrote', path.relative(process.cwd(), outPath));



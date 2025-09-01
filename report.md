## Rail Baron Conductor – Senior Engineer Code Review

### Executive summary

- **Overall**: Solid modular core under `src/core` and `src/ui`, with a modern, dependency-free browser app wired via `index.html`. Data is provided by generated modules for US/GB. Tests exist and catch a recent GB payout fix.
- **Main issues**: Legacy/unused code still in the repo, duplicated UI dialog logic, a bug in `src/ui/dialogs/statsDialog.js` referencing a non-existent global `state`, and some missing unit tests around core modules.
- **Top actions**: Remove/archive dead code, unify dialog logic, fix `statsDialog` to use the provided `state` parameter, deduplicate `getCurrentRegion`, and add focused unit tests for `core` modules.

---

### Architecture

- **App entry**: `index.html` loads data, core, and UI modules, then `app.js` orchestrates state, rendering, rolling, dialogs, and persistence.
- **Namespaces**: Browser-friendly `window.RB` namespace for `core` and `ui` modules; Node/Jest export paths are provided via `module.exports`.
- **Data**: Prefer generated datasets (`generated/boxcars-us-tables.generated.js`, `generated/boxcars-britain-tables.generated.js`). `app.js` selects US/GB and exposes `activeFindPayout`.
- **UI**: Stateless rendering functions in `src/ui/components` and dialog helpers in `src/ui/dialogs` called from `app.js`.

---

### Legacy code cleanup completed

All legacy code has been removed from the repository:
- Removed `legacy/` directory containing old AngularJS and jQuery implementations
- Removed unused `export:us` script that depended on legacy code
- Updated documentation to reflect the cleaned-up codebase

Notes:
- `boxcars-britain-tables.js` is a non-generated fallback copy; tests and `index.html` prefer generated data. Keep it if you want a human-editable source; otherwise document that only `generated/*` is authoritative.

---

### Functions that belong elsewhere / duplication

- Duplicate dialog logic lives both in `app.js` and in the dedicated dialog modules.
  - `app.js` contains inline UI for region/home-city when `RB.ui.dialogs` is absent. In the browser, `index.html` loads `src/ui/dialogs/*` before `app.js`, so the inline paths are redundant.
  - Recommendation: rely solely on `src/ui/dialogs/regionDialog.js` and `src/ui/dialogs/homeCityDialog.js` in the browser and drop the inlined dialog DOM code from `app.js`. Use small shims/mocks for Node/Jest if needed.

- `src/core/rolling.js` implements `getCurrentRegion` that mirrors `src/core/derived.js:getCurrentRegion`.
  - Recommendation: remove the duplicate in `rolling.js` and call `RB.derived.getCurrentRegion` instead.

---

### Bug(s) and correctness issues

- `src/ui/dialogs/statsDialog.js` chooses currency symbol using `root.state`, but `state` is passed as an argument by `app.js`. This will not reflect the actual app state unless a global `state` happens to exist.

```24:34:src/ui/dialogs/statsDialog.js
          + '            <td>' + ((root.state && root.state.settings && root.state.settings.map === 'GB') ? '£' : '$') + totals.totalPayout.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',') + '</td>\n'
```

Recommendation: use the provided `state` argument to decide the symbol, e.g. `state?.settings?.map === 'GB' ? '£' : '$'`.

---

### Complexity hotspots and refactoring opportunities

- `app.js` (approx ~590 lines): Orchestrates state, dialogs, rendering, drag/drop, import/export, and rolling. It is readable but multi-responsibility.
  - Recommendation: extract: (1) persistence (`loadState/saveState`), (2) dialog plumbing, (3) CSV/export, and (4) rendering orchestration into small modules under `src/ui/controllers` or a new `src/app/` namespace to improve maintainability and testability.

- Inline dialog logic in `app.js` (see above) adds complexity and duplication. Removing browser-only duplicates keeps `app.js` leaner.

---

### Code that can be simplified

- `formatCurrency` in `app.js` duplicates formatting logic. Consider moving to `src/core/format.js` as `formatCurrency(map, amount)` or reuse `csvEscape` patterns from there to keep formatting concerns together.
- `statsDialog.js` string templates manually format currency; extracting a small formatting utility will avoid repeating regex replacements.
- `src/ui/components/playerCard.js`: computing latest leg payout repeats logic available via `recomputeAllPayouts`. You could expose a `getLatestPayout(player)` helper in `core/payouts` for clarity.

---

### Test coverage assessment and gaps

Current tests:
- Good integration and GB data validation in `test/integration.test.js` and `test/payouts.test.js`.
- Debug-oriented tests with extensive `console.log` output (`debug-cities.test.js`, `payouts-simple.test.js`). These are helpful for triage but noisy in CI.

Gaps to address:
- No direct unit tests for `src/core/payouts.js` (`computePayout`, `recomputeAllPayouts`).
- No unit tests for `src/core/derived.js` (`getCurrentRegion`, `updateDerivedFields`).
- No unit tests for `src/core/stats.js` (`computeStats`, `buildCSV`).
- No deterministic tests for `src/core/rolling.js` (mock RNG, assert region/city selection paths and UI delegation behavior).
Recommendations:
- Add focused unit tests for `core` functions with small fixtures and mocks. Keep integration tests for end-to-end guarantees.
- Convert "debug" tests to assertions or mark them as opt-in (e.g., rename with `.debug.test.js` and exclude from default `testMatch`).

---

### Security and robustness

- Dialog and table rendering avoid innerHTML injection for names by using `RB.format.escapeHtml` in `statsDialog.js` for player names. Continue this pattern for any user-controlled strings.
- File import uses `JSON.parse` and basic shape checks; consider schema validation for robustness.

---

### Prioritized recommendations

1) High priority
- ✅ **COMPLETED**: Removed legacy code including old AngularJS and jQuery implementations
- Fix currency symbol source in `src/ui/dialogs/statsDialog.js` to use the `state` argument.
- Deduplicate dialog logic: drop inline dialog DOM code in `app.js` and rely on `src/ui/dialogs/*`.
- Deduplicate `getCurrentRegion` by using `RB.derived.getCurrentRegion` in `rolling.js`.
- Add unit tests for `core` modules: payouts, derived, stats, and rolling (with mocked RNG/UI ports).

2) Medium priority
- Extract `app.js` sections into smaller modules to reduce responsibilities and ease testing.
- Replace console-heavy debug tests with clean assertions or mark them as opt-in.
- Consolidate currency formatting into `src/core/format.js` and reuse.

3) Low priority
- Document the precedence of generated datasets vs. hand-maintained tables to avoid confusion.
- Consider a lightweight bundling/ESM step in the future; current script tags are fine for this project size.

---

### Quick win diffs (suggested)

- Use the provided state in `statsDialog.js` for currency symbol:

```24:34:src/ui/dialogs/statsDialog.js
-          + '            <td>' + ((root.state && root.state.settings && root.state.settings.map === 'GB') ? '£' : '$') + totals.totalPayout.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',') + '</td>\n'
+          + '            <td>' + ((state && state.settings && state.settings.map === 'GB') ? '£' : '$') + totals.totalPayout.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',') + '</td>\n'
```

- In `rolling.js`, remove the local `getCurrentRegion` and import/call `RB.derived.getCurrentRegion`.

---

### Final thoughts

The project is in good shape functionally, with clear separation of `core` and `ui` and a responsible use of globals for dual (browser + Jest) environments. Addressing the legacy remnants, tightening module boundaries, fixing the small `statsDialog` bug, and adding a handful of unit tests will meaningfully improve clarity and maintainability.



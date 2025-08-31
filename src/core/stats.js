(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var statsNs = RB.stats || (RB.stats = {});
  var fmt = (RB.format) || {};

  /**
   * Compute per-player and total stats from state.
   * Pure function; no DOM dependencies.
   * @param {{ players: any[] }} state
   * @param {boolean} includeUnreachable
   * @returns {{ rows: Array, totals: { legsCount:number, totalPayout:number, uniqueCities:number } }}
   */
  function computeStats(state, includeUnreachable) {
    var rows = state.players.map(function (p) {
      var legs = p.stops.filter(function (s, idx) {
        if (idx === p.stops.length - 1) return false; // last has no previous
        if (s.cityId == null || p.stops[idx + 1].cityId == null) return false;
        if (!includeUnreachable && s.unreachable) return false;
        return true;
      });
      var totalPayout = legs.reduce(function (sum, s) { return sum + (s.payoutFromPrev || 0); }, 0);
      var uniqueCities = new Set(p.stops.map(function (s) { return s.cityId; }).filter(Boolean)).size;
      return {
        playerId: p.id,
        name: p.name,
        legsCount: legs.length,
        totalPayout: totalPayout,
        uniqueCities: uniqueCities,
      };
    });
    var totals = rows.reduce(function (acc, r) {
      acc.legsCount += r.legsCount;
      acc.totalPayout += r.totalPayout;
      acc.uniqueCities += r.uniqueCities; // not unique across players; shown as sum
      return acc;
    }, { legsCount: 0, totalPayout: 0, uniqueCities: 0 });
    return { rows: rows, totals: totals };
  }

  /**
   * Build CSV string for stats export.
   * @param {{ players: any[] }} state
   * @param {boolean} includeUnreachable
   * @returns {string}
   */
  function buildCSV(state, includeUnreachable) {
    var csvEscape = (fmt && fmt.csvEscape) || function (val) {
      var s = String(val == null ? '' : val);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    var result = computeStats(state, includeUnreachable);
    var header = ['Player','Completed legs','Total payouts','Unique cities'];
    var lines = [header.join(',')];
    result.rows.forEach(function (r) {
      lines.push([
        csvEscape(r.name),
        r.legsCount,
        r.totalPayout,
        r.uniqueCities,
      ].join(','));
    });
    return lines.join('\n');
  }

  statsNs.computeStats = computeStats;
  statsNs.buildCSV = buildCSV;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computeStats: computeStats, buildCSV: buildCSV };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



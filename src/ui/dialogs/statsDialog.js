(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var statsUi = ui.stats || (ui.stats = {});

  function renderStatsTable(state, includeUnreachable) {
    var wrap = (typeof document !== 'undefined') && document.getElementById && document.getElementById('stats-table-wrap');
    if (!wrap) return;
    var stats = (RB.stats && RB.stats.computeStats) ? RB.stats.computeStats(state, includeUnreachable) : null;
    if (!stats) return;
    var rows = stats.rows, totals = stats.totals;
    var table = document.createElement('table');
    table.className = 'stats-table';
    table.innerHTML = (
      '<thead>\n        <tr>\n          <th>Player</th>\n          <th>Completed legs</th>\n          <th>Total payouts</th>\n          <th>Unique cities</th>\n        </tr>\n      </thead>\n      <tbody>\n        '
      + rows.map(function(r){
        return (
          '\n          <tr>\n'
          + '            <td>' + (RB.format && RB.format.escapeHtml ? RB.format.escapeHtml(r.name) : String(r.name)) + '</td>\n'
          + '            <td>' + r.legsCount + '</td>\n'
          + '            <td>' + (RB.format && RB.format.formatCurrency ? RB.format.formatCurrency(r.totalPayout, state && state.settings && state.settings.map) : r.totalPayout) + '</td>\n'
          + '            <td>' + r.uniqueCities + '</td>\n'
          + '          </tr>\n'
        );
      }).join('')
      + '\n      </tbody>\n      <tfoot>\n        <tr>\n'
      + '          <td>Totals</td>\n'
      + '          <td>' + totals.legsCount + '</td>\n'
      + '          <td>' + (RB.format && RB.format.formatCurrency ? RB.format.formatCurrency(totals.totalPayout, state && state.settings && state.settings.map) : totals.totalPayout) + '</td>\n'
      + '          <td>' + totals.uniqueCities + '</td>\n'
      + '        </tr>\n      </tfoot>\n    '
    );
    wrap.innerHTML = '';
    wrap.appendChild(table);
  }

  statsUi.renderStatsTable = renderStatsTable;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderStatsTable: renderStatsTable };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



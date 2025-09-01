(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var fmt = RB.format || (RB.format = {});

  function csvEscape(val) {
    var s = String(val == null ? '' : val);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCurrency(amount, map) {
    if (amount == null) return '';
    const symbol = (map === 'GB') ? '£' : '$';
    return symbol + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  fmt.csvEscape = csvEscape;
  fmt.escapeHtml = escapeHtml;
  fmt.formatCurrency = formatCurrency;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { csvEscape: csvEscape, escapeHtml: escapeHtml, formatCurrency: formatCurrency };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



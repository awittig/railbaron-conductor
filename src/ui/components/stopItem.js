(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var components = ui.components || (ui.components = {});
  var stopItemNs = components.stopItem || (components.stopItem = {});

  /**
   * Render a stop item DOM node.
   * @param {*} player
   * @param {*} stop
   * @param {number} stopIdx
   * @param {{ enrichedCities: Array<{id:number,name:string}>, formatCurrency: Function, recomputeAllPayouts: Function, saveState: Function, render: Function, defaultStop: Function }} ctx
   * @returns {HTMLElement}
   */
  function renderStopItem(player, stop, stopIdx, ctx) {
    var tplStopItem = (typeof document !== 'undefined') && document.getElementById && document.getElementById('tpl-stop-item');
    var node = tplStopItem && tplStopItem.content && tplStopItem.content.firstElementChild && tplStopItem.content.firstElementChild.cloneNode(true);
    if (!node) return document.createElement('div');
    node.dataset.stopIndex = String(stopIdx);
    node.classList.toggle('unreachable', !!stop.unreachable);

    // City select
    var citySelect = node.querySelector('.stop-city');
    citySelect.innerHTML = '';
    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— Select City —';
    citySelect.appendChild(blank);
    (ctx.enrichedCities || []).forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = String(c.id);
      opt.textContent = c.name;
      if (stop.cityId === c.id) opt.selected = true;
      citySelect.appendChild(opt);
    });
    citySelect.addEventListener('change', function () {
      stop.cityId = citySelect.value ? Number(citySelect.value) : null;
      ctx.recomputeAllPayouts(player);
      ctx.saveState();
      ctx.render();
    });

    // Payout
    var payoutSpan = node.querySelector('.payout');
    payoutSpan.textContent = ctx.formatCurrency(stop.payoutFromPrev);

    // Unreachable
    var unreachableCheckbox = node.querySelector('.stop-unreachable');
    unreachableCheckbox.checked = !!stop.unreachable;
    unreachableCheckbox.addEventListener('change', function () {
      stop.unreachable = unreachableCheckbox.checked;
      ctx.saveState();
      ctx.render();
    });

    // Delete stop (with confirmation)
    var delBtn = node.querySelector('.btn-delete-stop');
    delBtn.addEventListener('click', function () {
      if (!(typeof confirm === 'function' ? confirm('Delete this stop?') : true)) return;
      player.stops.splice(stopIdx, 1);
      if (player.stops.length === 0) player.stops.push(ctx.defaultStop());
      ctx.recomputeAllPayouts(player);
      ctx.saveState();
      ctx.render();
    });

    // Roll text
    var rollTextEl = node.querySelector('.roll-text');
    if (rollTextEl) rollTextEl.textContent = stop.lastRollText || '';

    return node;
  }

  stopItemNs.renderStopItem = renderStopItem;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderStopItem: renderStopItem };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



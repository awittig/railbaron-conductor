(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var components = ui.components || (ui.components = {});

  function renderPlayerCard(player, index, ctx) {
    var tplPlayerCard = document.getElementById('tpl-player-card');
    var node = tplPlayerCard.content.firstElementChild.cloneNode(true);
    node.dataset.playerId = player.id;
    node.classList.toggle('collapsed', !!player.collapsed);
    node.classList.toggle('selecting-home-city', !(player.stops || []).some(function (s) { return s.cityId; }));
    node.style.setProperty('--accent', ctx.colorToken(player.color));
    node.dataset.color = player.color;
    node.setAttribute('draggable', 'true');

    var nameInput = node.querySelector('.player-name');
    nameInput.value = player.name;
    nameInput.addEventListener('input', function () {
      player.name = nameInput.value;
      ctx.saveState();
    });

    var headerEl = node.querySelector('.player-header');
    var controlsEl = node.querySelector('.player-controls');
    var metaRow = document.createElement('div');
    metaRow.className = 'player-meta-inline';
    var homeSpan = document.createElement('span');
    homeSpan.className = 'home-city';
    var latestSpan = document.createElement('span');
    latestSpan.className = 'latest-dest';

    var hasHomeCity = (player.stops || []).some(function (s) { return s.cityId; });
    if (!hasHomeCity) {
      homeSpan.textContent = 'Click "Roll Home City" to start';
      homeSpan.className = 'home-city selecting';
      latestSpan.textContent = '';
    } else {
      var homeId = player.homeCityId || null;
      var homeName = homeId ? ((ctx.idToCity.get(homeId) || {}).name || null) : null;
      homeSpan.textContent = homeName ? ('Home: ' + homeName) : '';
      var latestIdx = player.stops.findIndex(function (s) { return !!s.cityId; });
      var latestStop = latestIdx >= 0 ? player.stops[latestIdx] : null;
      var latestName = (latestStop && latestStop.cityId) ? ((ctx.idToCity.get(latestStop.cityId) || {}).name || null) : null;
      var payoutSuffix = '';
      if (latestStop && latestStop.cityId) {
        var prevId = (player.stops[latestIdx + 1] || {}).cityId || null;
        var amt = ctx.computePayout(prevId, latestStop.cityId);
        if (amt != null) payoutSuffix = ' · ' + ctx.formatCurrency(amt);
      }
      latestSpan.textContent = latestName ? ('Latest: ' + latestName + payoutSuffix) : '';
    }
    metaRow.appendChild(homeSpan);
    metaRow.appendChild(latestSpan);
    var trainBubbles = node.querySelector('.train-bubbles');
    if (controlsEl && trainBubbles && controlsEl.contains(trainBubbles)) {
      controlsEl.insertBefore(metaRow, trainBubbles);
    } else if (headerEl && controlsEl && headerEl.contains(controlsEl)) {
      headerEl.insertBefore(metaRow, controlsEl);
    } else if (headerEl) {
      headerEl.appendChild(metaRow);
    }

    var colorBtn = node.querySelector('.btn-color');
    var applyAccent = function () {
      if (colorBtn) colorBtn.style.setProperty('--swatch', ctx.colorToken(player.color));
    };
    applyAccent();
    colorBtn.addEventListener('click', function () {
      var idx = (ctx.colorOptions.indexOf(player.color) + 1) % ctx.colorOptions.length;
      player.color = ctx.colorOptions[idx];
      node.style.setProperty('--accent', ctx.colorToken(player.color));
      node.dataset.color = player.color;
      applyAccent();
      ctx.saveState();
    });

    var bubbleGroup = node.querySelector('.train-bubbles');
    var updateBubbles = function () {
      bubbleGroup.querySelectorAll('.bubble').forEach(function (b) {
        var val = b.dataset.value;
        var checked = val === player.train;
        b.dataset.checked = checked ? 'true' : 'false';
        var input = b.querySelector('input[type="radio"]');
        if (input) input.checked = checked;
      });
    };
    bubbleGroup.addEventListener('click', function (e) {
      var label = e.target.closest('.bubble');
      if (!label) return;
      var val = label.dataset.value;
      if (val && val !== player.train) {
        player.train = val;
        ctx.saveState();
        updateBubbles();
      }
    });
    updateBubbles();

    var collapseBtn = node.querySelector('.btn-collapse');
    if (collapseBtn) {
      collapseBtn.textContent = player.collapsed ? '+' : '−';
      collapseBtn.addEventListener('click', function () {
        player.collapsed = !player.collapsed;
        ctx.saveState();
        ctx.render();
      });
    }
    var upBtn = node.querySelector('.btn-up');
    if (upBtn) { upBtn.textContent = '◀'; upBtn.addEventListener('click', function () { ctx.movePlayer(index, -1); }); }
    var downBtn = node.querySelector('.btn-down');
    if (downBtn) { downBtn.textContent = '▶'; downBtn.addEventListener('click', function () { ctx.movePlayer(index, +1); }); }
    node.querySelector('.btn-delete').addEventListener('click', function () { ctx.deletePlayer(player.id); });

    var stopsRoot = node.querySelector('.stop-list');
    stopsRoot.innerHTML = '';
    ctx.recomputeAllPayouts(player);
    player.stops.forEach(function (stop, stopIdx) {
      var stopNode = ctx.renderStopItem(player, stop, stopIdx);
      if (stop._justAdded) {
        stopNode.classList.add('enter');
        requestAnimationFrame(function () {
          stopNode.classList.add('enter-active');
          stopNode.classList.remove('enter');
          setTimeout(function () { stopNode.classList.remove('enter-active'); }, 260);
        });
        delete stop._justAdded;
      }
      stopsRoot.appendChild(stopNode);
    });

    var addStopBtn = node.querySelector('.btn-add-stop');
    var rollStopBtn = node.querySelector('.btn-roll-stop');
    rollStopBtn.textContent = hasHomeCity ? 'Roll Stop' : 'Roll Home City';
    rollStopBtn.setAttribute('aria-label', hasHomeCity ? 'Roll destination' : 'Roll for home city');
    rollStopBtn.setAttribute('title', hasHomeCity ? 'Roll destination' : 'Roll for home city');
    addStopBtn.disabled = !hasHomeCity;
    addStopBtn.title = hasHomeCity ? 'Add stop' : 'Select home city first';

    addStopBtn.addEventListener('click', function () {
      player.stops.unshift(ctx.defaultStop());
      ctx.saveState();
      ctx.render();
    });
    rollStopBtn.addEventListener('click', function () { ctx.rollNextStop(player, node); });

    return node;
  }

  components.playerCard = { renderPlayerCard: renderPlayerCard };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { renderPlayerCard: renderPlayerCard };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



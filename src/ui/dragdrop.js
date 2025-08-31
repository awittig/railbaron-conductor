(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var ui = RB.ui || (RB.ui = {});
  var dragdrop = ui.dragdrop || (ui.dragdrop = {});

  function bind(playersRoot, state, saveState, render) {
    var cards = Array.from(playersRoot.querySelectorAll('.player-card'));
    var dragId = null;
    cards.forEach(function (card) {
      card.addEventListener('dragstart', function (e) {
        dragId = card.dataset.playerId;
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      card.addEventListener('drop', function (e) {
        e.preventDefault();
        var targetId = card.dataset.playerId;
        if (!dragId || dragId === targetId) return;
        var fromIdx = state.players.findIndex(function (p) { return p.id === dragId; });
        var toIdx = state.players.findIndex(function (p) { return p.id === targetId; });
        if (fromIdx < 0 || toIdx < 0) return;
        var moved = state.players.splice(fromIdx, 1);
        state.players.splice(toIdx, 0, moved[0]);
        saveState();
        render();
      });
    });
  }

  dragdrop.bind = bind;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bind: bind };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



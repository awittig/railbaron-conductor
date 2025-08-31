(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var stateNs = RB.state || (RB.state = {});

  function movePlayer(state, index, delta) {
    var newIndex = index + delta;
    if (newIndex < 0 || newIndex >= state.players.length) return;
    var moved = state.players.splice(index, 1);
    state.players.splice(newIndex, 0, moved[0]);
  }

  stateNs.movePlayer = movePlayer;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { movePlayer: movePlayer };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



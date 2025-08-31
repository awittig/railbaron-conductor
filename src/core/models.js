(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var models = RB.models || (RB.models = {});

  function uuid() {
    return 'p-' + Math.random().toString(36).slice(2, 9);
  }

  function defaultStop() {
    return { cityId: null, payoutFromPrev: null, unreachable: false, lastRollText: '' };
  }

  function defaultPlayer() {
    return {
      id: uuid(),
      name: 'Player',
      color: 'black',
      train: 'Standard',
      stops: [defaultStop()],
      collapsed: false,
    };
  }

  models.uuid = uuid;
  models.defaultStop = defaultStop;
  models.defaultPlayer = defaultPlayer;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { uuid: uuid, defaultStop: defaultStop, defaultPlayer: defaultPlayer };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



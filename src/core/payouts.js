(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var payoutsNs = RB.payouts || (RB.payouts = {});

  /**
   * Compute a payout given a resolver function and two city ids.
   * @param {(a:number,b:number)=>number|undefined|null} findPayoutFn
   * @param {number|null|undefined} prevCityId
   * @param {number|null|undefined} currCityId
   * @returns {number|null}
   */
  function computePayout(findPayoutFn, prevCityId, currCityId) {
    if (!prevCityId || !currCityId) return null;
    if (typeof findPayoutFn !== 'function') return null;
    var amount = findPayoutFn(prevCityId, currCityId);
    return (typeof amount === 'number') ? amount : null;
  }

  /**
   * Recompute payouts for all stops on a player in-place.
   * @param {{stops: Array<{cityId:number|null,payoutFromPrev:number|null}>}} player
   * @param {(a:number,b:number)=>number|undefined|null} findPayoutFn
   */
  function recomputeAllPayouts(player, findPayoutFn) {
    var stops = player.stops || [];
    for (var i = 0; i < stops.length; i++) {
      var curr = stops[i];
      var prev = stops[i + 1]; // older stop is next in the list (newest at top)
      curr.payoutFromPrev = computePayout(findPayoutFn, (prev && prev.cityId) || null, curr.cityId || null);
    }
  }

  payoutsNs.computePayout = computePayout;
  payoutsNs.recomputeAllPayouts = recomputeAllPayouts;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { computePayout: computePayout, recomputeAllPayouts: recomputeAllPayouts };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



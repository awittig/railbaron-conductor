(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var derivedNs = RB.derived || (RB.derived = {});

  /**
   * Returns the region of the latest non-null stop using an id→city map.
   * @param {{stops:Array<{cityId:number|null}>}} player
   * @param {Map<number,{id:number,name:string,region:string|null}>} idToCity
   * @returns {string|null}
   */
  function getCurrentRegion(player, idToCity) {
    var latest = (player.stops || []).find(function (s) { return !!s.cityId; });
    if (!latest) return null;
    var c = idToCity && idToCity.get(latest.cityId);
    return (c && c.region) || null;
  }

  /**
   * Updates visitedCityIds and homeCityId on the player in-place.
   * @param {{stops:Array<{cityId:number|null}>}} player
   */
  function updateDerivedFields(player) {
    var visited = (player.stops || []).map(function (s) { return s.cityId; }).filter(Boolean);
    player.visitedCityIds = visited;
    var home = null;
    for (var i = (player.stops || []).length - 1; i >= 0; i--) {
      var cid = player.stops[i].cityId;
      if (cid) { home = cid; break; }
    }
    player.homeCityId = home;
  }

  derivedNs.getCurrentRegion = getCurrentRegion;
  derivedNs.updateDerivedFields = updateDerivedFields;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getCurrentRegion: getCurrentRegion, updateDerivedFields: updateDerivedFields };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



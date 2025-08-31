(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var rolling = RB.rolling || (RB.rolling = {});

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  /**
   * Roll next stop. Uses injected ports for RNG, dataset, and UI.
   * @param {any} player
   * @param {{ map: 'US'|'GB', idToCity: Map<number,{id:number,name:string}>, chooseRegion: (defaultRegion:string)=>Promise<string>, chooseHomeCity: (region:string)=>Promise<number|null>, rngOddEven: ()=>('odd'|'even'), rng2d6: ()=>number, BOXCARS: any, BOXCARS_GB?: any, destinationTableGB?: any, defaultStop: Function, recomputeAllPayouts: Function, saveState: Function, render: Function }} ctx
   */
  async function rollNextStop(player, ctx) {
    var isEmpty = (player.stops || []).every(function (s) { return !s.cityId; });
    if (isEmpty) {
      await rollHomeCity(player, ctx);
      return;
    }
    var oe1 = ctx.rngOddEven();
    var s1 = ctx.rng2d6();
    var region;
    if (ctx.map === 'GB' && ctx.destinationTableGB) {
      var table = ctx.destinationTableGB.regionChart[oe1];
      region = table && table[s1];
    } else {
      region = ctx.BOXCARS.mapRegion(oe1, s1);
    }
    var currentRegion = getCurrentRegion(player, ctx.idToCity);
    if (currentRegion && region === currentRegion) {
      region = await ctx.chooseRegion(region);
    }
    var oe2 = ctx.rngOddEven();
    var s2 = ctx.rng2d6();
    var cityId = null;
    var cityName = '—';
    if (ctx.map === 'GB' && ctx.destinationTableGB && ctx.BOXCARS_GB) {
      var rchart = ctx.destinationTableGB.destinationCharts[region];
      var cname = rchart && rchart[oe2] && rchart[oe2][s2] || null;
      cityName = cname || '—';
      if (cname) { cityId = ctx.BOXCARS_GB.resolveIdByName(cname); }
    } else {
      cityId = ctx.BOXCARS.pickCityByTable(region, oe2, s2);
      var c = cityId && ctx.idToCity.get(cityId);
      cityName = (c && c.name) || '—';
    }
    var rollText = cap(oe1) + '+' + s1 + ' → ' + region + '; ' + cap(oe2) + '+' + s2 + ' → ' + cityName + '.';
    var newStop = ctx.defaultStop();
    if (cityId) newStop.cityId = cityId;
    newStop.lastRollText = rollText;
    newStop._justAdded = true;
    player.stops.unshift(newStop);
    player._pendingRollText = '';
    ctx.recomputeAllPayouts(player);
    ctx.saveState();
    ctx.render();
  }

  /**
   * Roll and choose home city (first stop).
   * @param {any} player
   * @param {*} ctx see rollNextStop
   */
  async function rollHomeCity(player, ctx) {
    var oe1 = ctx.rngOddEven();
    var s1 = ctx.rng2d6();
    var region;
    if (ctx.map === 'GB' && ctx.destinationTableGB) {
      var table = ctx.destinationTableGB.regionChart[oe1];
      region = table && table[s1];
    } else {
      region = ctx.BOXCARS.mapRegion(oe1, s1);
    }
    var rollText = cap(oe1) + '+' + s1 + ' → ' + region;
    var selectedCityId = await ctx.chooseHomeCity(region);
    if (selectedCityId) {
      var target = player.stops[player.stops.length - 1];
      target.cityId = selectedCityId;
      var cname = (ctx.idToCity.get(selectedCityId) || {}).name || 'Unknown City';
      target.lastRollText = rollText + ' → ' + cname;
      ctx.recomputeAllPayouts(player);
      ctx.saveState();
      ctx.render();
    }
  }

  function getCurrentRegion(player, idToCity) {
    var latest = (player.stops || []).find(function (s) { return !!s.cityId; });
    if (!latest) return null;
    var c = idToCity && idToCity.get(latest.cityId);
    return (c && c.region) || null;
  }

  rolling.rollNextStop = rollNextStop;
  rolling.rollHomeCity = rollHomeCity;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rollNextStop: rollNextStop, rollHomeCity: rollHomeCity };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



(function (global) {
  'use strict';

  var root = global || {};
  var RB = root.RB || (root.RB = {});
  var rolling = RB.rolling || (RB.rolling = {});

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  /**
   * Generate random odd/even string.
   * @returns {'odd'|'even'}
   */
  function rollOddEven() {
    return Math.random() < 0.5 ? "odd" : "even";
  }

  /**
   * Roll two six-sided dice and return the sum.
   * @returns {number} Sum from 2-12
   */
  function roll2d6() {
    return (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
  }

  /**
   * Roll next stop. Uses injected ports for RNG, dataset, and UI.
   * @param {any} player
   * @param {{ map: 'US'|'GB', idToCity: Map<number,{id:number,name:string}>, chooseRegion: (defaultRegion:string)=>Promise<string>, chooseHomeCity: (region:string)=>Promise<number|null>, rngOddEven: ()=>('odd'|'even'), rng2d6: ()=>number, dataset: any, defaultStop: Function, recomputeAllPayouts: Function, saveState: Function, render: Function }} ctx
   */
  async function rollNextStop(player, ctx) {
    var isEmpty = (player.stops || []).every(function (s) { return !s.cityId; });
    if (isEmpty) {
      await rollHomeCity(player, ctx);
      return;
    }
    var oe1 = ctx.rngOddEven();
    var s1 = ctx.rng2d6();
    
    // Use unified dataset API for region lookup
    var region;
    if (ctx.dataset && ctx.dataset.destinationTable && ctx.dataset.destinationTable.regionChart) {
      var table = ctx.dataset.destinationTable.regionChart[oe1];
      region = table && table[s1];
    }
    
    var currentRegion = RB.derived.getCurrentRegion(player, ctx.idToCity);
    if (currentRegion && region === currentRegion) {
      region = await ctx.chooseRegion(region);
    }
    
    var oe2 = ctx.rngOddEven();
    var s2 = ctx.rng2d6();
    var cityId = null;
    var cityName = '—';
    
    // Use unified dataset API for city lookup
    if (ctx.dataset && ctx.dataset.destinationTable && ctx.dataset.destinationTable.destinationCharts) {
      var rchart = ctx.dataset.destinationTable.destinationCharts[region];
      var cname = rchart && rchart[oe2] && rchart[oe2][s2] || null;
      cityName = cname || '—';
      if (cname && ctx.dataset.resolveIdByName) {
        cityId = ctx.dataset.resolveIdByName(cname);
      }
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
    
    // Use unified dataset API for region lookup
    var region;
    if (ctx.dataset && ctx.dataset.destinationTable && ctx.dataset.destinationTable.regionChart) {
      var table = ctx.dataset.destinationTable.regionChart[oe1];
      region = table && table[s1];
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



  rolling.rollNextStop = rollNextStop;
  rolling.rollHomeCity = rollHomeCity;
  rolling.rollOddEven = rollOddEven;
  rolling.roll2d6 = roll2d6;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { rollNextStop: rollNextStop, rollHomeCity: rollHomeCity, rollOddEven: rollOddEven, roll2d6: roll2d6 };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));



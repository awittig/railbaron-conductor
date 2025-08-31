const path = require('path');

describe('GB payout Bangor -> Hereford', () => {
  let app, boxcarsGB;

  beforeAll(() => {
    require(path.join(__dirname, '../payouts.js'));
    require(path.join(__dirname, '../boxcars-tables.js'));
    try { require(path.join(__dirname, '../generated/boxcars-britain-tables.generated.js')); }
    catch (e) { require(path.join(__dirname, '../boxcars-britain-tables.js')); }
    // Load RB modules to satisfy app.js dependencies
    require(path.join(__dirname, '../src/core/format.js'));
    require(path.join(__dirname, '../src/core/models.js'));
    require(path.join(__dirname, '../src/core/payouts.js'));
    require(path.join(__dirname, '../src/core/derived.js'));
    require(path.join(__dirname, '../src/core/stats.js'));
    require(path.join(__dirname, '../src/core/rolling.js'));
    require(path.join(__dirname, '../src/core/state.js'));
    require(path.join(__dirname, '../src/ui/components/stopItem.js'));
    require(path.join(__dirname, '../src/ui/components/playerCard.js'));
    require(path.join(__dirname, '../src/ui/dialogs/statsDialog.js'));
    require(path.join(__dirname, '../src/ui/dialogs/regionDialog.js'));
    require(path.join(__dirname, '../src/ui/dialogs/homeCityDialog.js'));
    require(path.join(__dirname, '../src/ui/dialogs/mapDialog.js'));
    require(path.join(__dirname, '../src/ui/dragdrop.js'));
    require(path.join(__dirname, '../src/ui/controllers.js'));
    
    require(path.join(__dirname, '../app.js'));
    app = global.railbaronApp;
    boxcarsGB = global.BOXCARS_GB || (global.window && global.window.BOXCARS_GB);
  });

  test('Bangor to Hereford is 8 via app.activeFindPayout', () => {
    expect(app).toBeDefined();
    expect(typeof app.activeFindPayout).toBe('function');
    // Force GB dataset if helper exists; otherwise rely on default
    if (typeof app.setMap === 'function') app.setMap('GB');
    const bangorId = boxcarsGB.resolveIdByName('Bangor');
    const herefordId = boxcarsGB.resolveIdByName('Hereford');
    const payout = app.activeFindPayout(bangorId, herefordId);
    expect(payout).toBe(8);
  });
});



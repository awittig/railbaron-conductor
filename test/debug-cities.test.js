/**
 * Debug test to find actual city IDs and indices
 */

const path = require('path');

describe('Debug City Information', () => {
  let boxcarsGB, payoffTableGB;
  
  beforeAll(() => {
    require(path.join(__dirname, '../boxcars-britain-tables.js'));
    boxcarsGB = global.BOXCARS_GB;
    payoffTableGB = global.payoffTableGB;
  });

  test('should show actual city information', () => {
    console.log('Total cities:', boxcarsGB.CITIES.length);
    
    // Find Hereford and Bangor
    const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
    const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
    
    if (hereford) {
      console.log('Hereford:', {
        name: hereford.name,
        id: hereford.id,
        index: hereford.id - 1
      });
    }
    
    if (bangor) {
      console.log('Bangor:', {
        name: bangor.name,
        id: bangor.id,
        index: bangor.id - 1
      });
    }
    
    // Show first few cities
    console.log('First 10 cities:');
    boxcarsGB.CITIES.slice(0, 10).forEach((city, index) => {
      console.log(`${index}: ${city.name} (ID: ${city.id})`);
    });
    
    // Show cities around Hereford and Bangor
    if (hereford && bangor) {
      const herefordIndex = hereford.id - 1;
      const bangorIndex = bangor.id - 1;
      
      console.log(`\nHereford row (${herefordIndex}):`, payoffTableGB.matrix[herefordIndex].slice(0, 10));
      console.log(`Bangor row (${bangorIndex}):`, payoffTableGB.matrix[bangorIndex].slice(0, 10));
      
      // Check the specific payout
      const payout = payoffTableGB.matrix[herefordIndex][bangorIndex];
      console.log(`Payout from Hereford (${herefordIndex}) to Bangor (${bangorIndex}): ${payout}`);
    }
    
    // This test will always pass, it's just for debugging
    expect(true).toBe(true);
  });
});

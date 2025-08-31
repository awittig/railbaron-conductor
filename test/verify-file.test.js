/**
 * Test to verify the exact content of the file vs what's loaded
 */

const path = require('path');
const fs = require('fs');

describe('File Content Verification', () => {
  test('should verify file content matches loaded content', () => {
    // Read the file directly
    const filePath = path.join(__dirname, '../boxcars-britain-tables.js');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('=== FILE CONTENT VERIFICATION ===');
    
    // Find Hereford in the cities array
    const citiesMatch = fileContent.match(/cities:\s*\[([\s\S]*?)\]/);
    if (citiesMatch) {
      const citiesString = citiesMatch[1];
      const cities = citiesString.split(',').map(c => c.trim().replace(/"/g, ''));
      
      console.log('Cities array length:', cities.length);
      
      // Find Hereford position
      const herefordIndex = cities.findIndex(city => city === 'Hereford');
      console.log('Hereford index in file:', herefordIndex);
      console.log('Hereford city id in file:', herefordIndex + 1);
      
      // Find Bangor position
      const bangorIndex = cities.findIndex(city => city === 'Bangor');
      console.log('Bangor index in file:', bangorIndex);
      console.log('Bangor city id in file:', bangorIndex + 1);
      
      // Show cities around Hereford
      const start = Math.max(0, herefordIndex - 2);
      const end = Math.min(cities.length, herefordIndex + 3);
      console.log('Cities around Hereford:', cities.slice(start, end));
    }
    
    // Now load the module and check what's actually loaded
    require(path.join(__dirname, '../boxcars-britain-tables.js'));
    
    const boxcarsGB = global.BOXCARS_GB;
    const payoffTableGB = global.payoffTableGB;
    
    console.log('\n=== LOADED CONTENT VERIFICATION ===');
    console.log('payoffTableGB.cities length:', payoffTableGB.cities.length);
    
    // Find Hereford in loaded content
    const loadedHerefordIndex = payoffTableGB.cities.findIndex(city => city === 'Hereford');
    console.log('Hereford index in loaded content:', loadedHerefordIndex);
    console.log('Hereford city id in loaded content:', loadedHerefordIndex + 1);
    
    // Find Bangor in loaded content
    const loadedBangorIndex = payoffTableGB.cities.findIndex(city => city === 'Bangor');
    console.log('Bangor index in loaded content:', loadedBangorIndex);
    console.log('Bangor city id in loaded content:', loadedBangorIndex + 1);
    
    // Check BOXCARS_GB.CITIES
    console.log('\nBOXCARS_GB.CITIES length:', boxcarsGB.CITIES.length);
    
    const hereford = boxcarsGB.CITIES.find(city => city.name === 'Hereford');
    const bangor = boxcarsGB.CITIES.find(city => city.name === 'Bangor');
    
    if (hereford) {
      console.log('Hereford in BOXCARS_GB.CITIES:', {
        name: hereford.name,
        id: hereford.id,
        index: hereford.id - 1
      });
    }
    
    if (bangor) {
      console.log('Bangor in BOXCARS_GB.CITIES:', {
        name: bangor.name,
        id: bangor.id,
        index: bangor.id - 1
      });
    }
    
    // Verify the matrix value
    if (hereford && bangor) {
      const herefordIndex = hereford.id - 1;
      const bangorIndex = bangor.id - 1;
      
      console.log('\n=== MATRIX VERIFICATION ===');
      console.log('Looking at matrix[', herefordIndex, '][', bangorIndex, ']');
      
      const matrixValue = payoffTableGB.matrix[herefordIndex][bangorIndex];
      console.log('Matrix value:', matrixValue);
      
      // Also check the row to see what's there
      const row = payoffTableGB.matrix[herefordIndex];
      console.log('Row values around Bangor index:', row.slice(Math.max(0, bangorIndex - 2), bangorIndex + 3));
    }
  });
});

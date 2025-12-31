const geojsonvt = require('geojson-vt');
console.log('Type of geojsonvt:', typeof geojsonvt);
console.log('geojsonvt:', geojsonvt);
if (typeof geojsonvt !== 'function') {
    console.log('Does it have default?', geojsonvt.default);
}

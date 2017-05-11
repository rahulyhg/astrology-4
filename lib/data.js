'use strict';
var astro = require('../web/api/astrolabe');



var date = { year: 1981, month: 2, day: 6, hour: 0, minute: 5, second: 0 };

var timeZone = 8;
var splitHouses = 'P';
var geoLon = 111.88;
var geoLat = 29.61;
var out1 = astro.queryAdtroData(date, timeZone, geoLon, geoLat, splitHouses);
var out = astro.countAstroData(out1);

console.log(out);
console.log('------------------------------------');
for (var i in out.planets) {
  var p = out.planets[i];
  console.log('p:%s, lat:%s, %s', i, astro.toDegree(p.lat), astro.toDegree(parseFloat(p.lon - out.asc)));
}
console.log('------------------------------------');
// for (var j = 0; j < out.aspects.length; j++) {
//   var angle = toDegree(out.aspects[j][3]);
//   console.log('%j,  -- %s', out.aspects[j], angle);
// }


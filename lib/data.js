'use strict';
var astro = require('../web/api/astrolabe');
var kc = require('kc');
var mongo = kc.mongo;
var vlog = require('vlog').instance(__filename);

var date = { year: 1981, month: 2, day: 6, hour: 0, minute: 5, second: 0 };

var timeZone = 8;
var splitHouses = 'P';
var geoLon = 111.88;
var geoLat = 29.61;
var astroData = astro.queryAdtroData(date, timeZone, geoLon, geoLat, splitHouses);
var out1 = astro.countAstroData(astroData);

console.log(out1);
console.log('------------------------------------');

date = { year: 1979, month: 10, day: 29, hour: 3, minute: 0, second: 0 };
timeZone = 8;
splitHouses = 'P';
geoLon = 118.46;
geoLat = 34.08;
astroData = astro.queryAdtroData(date, timeZone, geoLon, geoLat, splitHouses);
var out2 = astro.countAstroData(astroData);

// console.log(out2);
console.log('------------------------------------');
console.log('-------------compairsion----------------');

var compairsion = function(astroDataA, astroDataB) {
  var housesInA = {};
  for (var j in astroDataB.planets) {
    var lon = astroDataB.planets[j].lon;
    var housePo = astro.checkOnePlanetLocation(lon, astroDataA.houses);
    // console.log('%j, housePo:%j,lon:%j',j,housePo,lon);
    housesInA[j] = {
      inHouseA: housePo + 1,
      inHousesADegree: astro.toDegree(lon - astroDataA.houses[housePo])
    };
  }
  var aspectsInA = astro.aspectCount(astroDataA.planets, astroDataB.planets);
  return { 'housesInA': housesInA, 'aspectsInA': aspectsInA };
};
console.log(compairsion(out1, out2));
console.log('------------------------------------');


var findPlus = function(sign, pobj, plusMap) {
  for (var i in pobj) {
    var zo = pobj[i];
    if (zo.inZodiacPlusEn !== '') {
      plusMap[zo.planetNameEn.toLowerCase() + ':' + sign.toLowerCase()] = zo.inZodiacPlusEn.toLowerCase();
    }
  }
};

var showAllSignPlus = function() {

  var plusMap = {};

  mongo.init(__dirname + '/../config.json', function(err) {
    if (err) {
      vlog.eo(err, 'mongo');
      return;
    }
    mongo.queryFromDb('zodiac', {}, { 'limit': 9999 }, function(err, zodiacArr) {
      if (err) {
        vlog.eo(err, '');
        return;
      }
      for (var i = 0; i < zodiacArr.length; i++) {
        var zobj = zodiacArr[i];
        if (!zobj.zodiacEn) {
          console.log(zobj);
        }
        findPlus(zobj.zodiacEn, zobj.planets, plusMap);
      }
      console.log(plusMap);
    });

  });
};

// showAllSignPlus();

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
var out1 = astro.queryAdtroData(date, timeZone, geoLon, geoLat, splitHouses);
var out = astro.countAstroData(out1);

console.log(out);
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
'use strict';
var assert = require('assert');

/*
Horoscop [JD: 2444642; F: -7.0; SZ: 18°17'9";

House "Placidus" [AC:07°19'24"; 2:46°29'31"; 3:72°26'43"; IC:93°56'13"; 5:116°04'04"; 6:144°18'33";
DC:187°19'24"; 8:226°29'31"; 9:252°26'43"; MC:273°56'13"; 11:296°04'04"; 12:324°18'33"; ];

Planets "AA0" [Sun:316°49'40"; Moon:326°52'26"; Mercury:334°13'42";
Venus:301°49'49"; Mars:329°02'23"; Jupiter:190°00'22"; Saturn:189°54'37";
Uranus:240°27'48"; Neptune:263°42'07"; Pluto:204°13'36"; ];]
 */


var Person = require('astrologyjs').Person; //有服务端依赖,不可用
var Chart = require('astrologyjs').Chart;
var ChartFactory = require('astrologyjs').ChartFactory;

var person;
var chart;

Person.create("Kenji", "1974-02-17T23:30Z", { lat: 37.4381927, lng: -79.18932 }).then(
  p => {
    person = p;
    // ...do other stuff, i.e. create a chart
    console.log('person:%j', person);

    ChartFactory.create("Kenji's natal chart", person).then(
      c => {
        chart = c;
        // ... do stuff with your chart ...
        console.log('chart:%j', chart.aspects[10].type);
      },
      err => "Ruh, roh. Something went wrong."
    );
  },
  err => "Ruh, roh. Something went wrong."
);

// console.log('========================================================');
// console.log('========================================================');


// var ephemeris = require('ephemeris-moshier');

// var result = ephemeris.getAllPlanets('06.02.1981 1:00:00', 116.28, 39.55, 0);


// console.log(result.observed.sun);
console.log('========================================================');
console.log('========================================================');
var swisseph = require('swisseph');

var version = swisseph.swe_version ();

console.log ('Swiss Ephemeris version:', version);
// Test date
var date = { year: 1981, month: 2, day: 6, hour: 1, minute: 0, second: 0 };
console.log('Test date:', date);

var flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH | swisseph.SEFLG_TOPOCTR;
// path to ephemeris data
swisseph.swe_set_ephe_path(__dirname + '/../ephe');


// swisseph.swe_revjul(2444641.2083, swisseph.SE_GREG_CAL, function(re) {
//   console.log('swe_revjul:%j', re);
// });
var timeZone = 8;

var toDegree = function(longitude) {
  var s = longitude;
  if (s < 0.0) {
    s = -s;
  }
  var d = Math.floor(s);
  s -= d;
  s *= 60;
  var m = Math.floor(s);
  s -= m;
  s *= 60;
  return d + '°' + m + '\'' + Math.floor(s);
};

swisseph.swe_utc_time_zone(date.year, date.month, date.day, date.hour, date.minute, date.second, timeZone, function(re) {
  date = re;
  console.log('Date from 8 Time Zone:', re, date);
});
// Julian day
var julday_ut = 0;
swisseph.swe_julday(date.year, date.month, date.day, date.hour, swisseph.SE_GREG_CAL, function(re) {
  julday_ut = re;
  // assert.equal (julday_ut, 2455927.5);
  console.log('Julian UT day for date:', julday_ut);
});

var geoLon = 116.28;
var geoLat = 39.55;
// swisseph.swe_set_topo(116.28, 39.55, 0);
swisseph.swe_set_topo(0, 0, 0);


// Sun name
swisseph.swe_get_planet_name(swisseph.SE_SUN, flag, function(body) {
  assert(!body.error, body.error);
  console.log('Sun name:', body);
});

// Sun position
swisseph.swe_calc_ut(julday_ut, swisseph.SE_SUN, flag, function(body) {
  assert(!body.error, body.error);
  console.log('Sun position:', body);
  console.log('Sun degree:%j', toDegree(body.longitude));
});

// Moon position
swisseph.swe_calc_ut(julday_ut, swisseph.SE_MOON, flag, function(body) {
  assert(!body.error, body.error);
  console.log('Moon position:', body);
  console.log('Moon degree:%j', toDegree(body.longitude));
  // Moon house position
  swisseph.swe_houses_pos(24, 0, 23, 'K', body.longitude, body.latitude, function(result) {
    assert(!result.error, result.error);
    console.log('Moon house position:', result);
  });
});

var ephs = [
  'SE_SUN',
  'SE_MOON',
  'SE_MERCURY',
  'SE_VENUS',
  'SE_MARS',
  'SE_JUPITER',
  'SE_SATURN',
  'SE_URANUS',
  'SE_NEPTUNE',
  'SE_PLUTO',
  'SE_MEAN_NODE',
  'SE_CHIRON',
  'SE_PHOLUS',
  'SE_CERES',
  'SE_PALLAS',
  'SE_JUNO',
  'SE_VESTA',
  'SE_CUPIDO'
  // swisseph.SE_AST_OFFSET + 10199,  // chariklo
  // swisseph.SE_AST_OFFSET + 19521,  // chaos
  // swisseph.SE_AST_OFFSET + 136199, // eris
  // swisseph.SE_AST_OFFSET + 7066    // nessus
];

var outAll = {};

for (var i = 0; i < ephs.length; i++) {
  var tag = ephs[i].substring(3);
  var tagEph = swisseph[ephs[i]];
  // var positionBody = null;
  swisseph.swe_calc_ut(julday_ut, tagEph, flag, function(body) {
    console.log('%j position:%j , \ndegree:%j \n', tag, body, toDegree(body.longitude));
    var out = {};
    out.name = tag.toLowerCase();
    out.lon = body.longitude;
    out.lat = body.latitude;
    out.spd = body.longitudeSpeed;
    out.r = (body.longitudeSpeed[3] < 0) ? 1 : 0;
    outAll[tag.toLowerCase()] = out;
  });
}

var addEphs = [
  swisseph.SE_AST_OFFSET + 10199, // chariklo
  swisseph.SE_AST_OFFSET + 19521, // chaos
  swisseph.SE_AST_OFFSET + 136199, // eris
  swisseph.SE_AST_OFFSET + 7066 // nessus
];


for (var i = 0; i < addEphs.length; i++) {
  var tagName = null;
  swisseph.swe_get_planet_name(addEphs[i], flag, function(pName) {
    tagName = pName.name.toLowerCase();
  });
  swisseph.swe_calc_ut(julday_ut, addEphs[i], flag, function(body) {
    console.log('!!!!%j position:%j , \ndegree:%j \n', tagName, body, toDegree(body.longitude));
    var out = {};
    out.name = tagName;
    out.lon = body.longitude;
    out.lat = body.latitude;
    out.spd = body.longitudeSpeed;
    out.r = (body.longitudeSpeed[3] < 0) ? 1 : 0;
    outAll[tagName] = out;
  });

}


// console.log('outAll:%j', outAll);

console.log('========================================================');
swisseph.swe_houses(julday_ut, geoLat, geoLon, 'P', function(result) {
  // assert (!result.error, result.error);
  if (result.error) {
    console.log(result.error);
  }
  console.log('Houses for date:', result);
  console.log('house degree:%j',toDegree(result.ascendant),toDegree(result.mc));
});
console.log('========================================================');


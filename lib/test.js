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

// Person.create("Kenji", "1974-02-17T23:30Z", { lat: 37.4381927, lng: -79.18932 }).then(
//   p => {
//     person = p;
//     // ...do other stuff, i.e. create a chart
//     console.log('person:%j', person);

//     ChartFactory.create("Kenji's natal chart", person).then(
//       c => {
//         chart = c;
//         // ... do stuff with your chart ...
//         // console.log('chart:%j', chart.aspects[10]);

//         var arr = [];
//         for (var i = 0; i < chart.aspects.length; i++) {
//           var obj = chart.aspects[i];
//           if (obj._applying && obj.p1.name === 'sun') {

//             delete obj._types;
//             delete obj.p1.symbols;
//             delete obj.p2.symbols;
//             arr.push(chart.aspects[i]);
//           }
//         }
//         console.log('-------> arr:%j');
//         console.log(arr);
//         console.log('----> arr len:%j', arr.length);
//       },
//       err => "Ruh, roh. Something went wrong."
//     );
//   },
//   err => "Ruh, roh. Something went wrong."
// );

// console.log('========================================================');
// console.log('========================================================');


// var ephemeris = require('ephemeris-moshier');

// var result = ephemeris.getAllPlanets('06.02.1981 1:00:00', 116.28, 39.55, 0);


// console.log(result.observed.sun);
console.log('========================================================');
console.log('========================================================');
var swisseph = require('swisseph');

var version = swisseph.swe_version();

console.log('Swiss Ephemeris version:', version);
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


console.log('outAll:%j', outAll);

console.log('========================================================');
swisseph.swe_houses(julday_ut, geoLat, geoLon, 'P', function(result) {
  // assert (!result.error, result.error);
  if (result.error) {
    console.log(result.error);
  }
  console.log('Houses for date:', result);
  console.log('house degree:%j', toDegree(result.ascendant), toDegree(result.mc));
});
console.log('========================================================');

/**
 * Creates a new Aspect or throws an error if no aspect exists
 * between the planets
 * @param {Planet} public p1 First planet in the relationship
 * @param {Planet} public p2 Second planet in the relationship
 */
function Aspect(p1, p2) {
  var isRetrograde = function(p) {
    return p.speed < 0;
  };
  /**
   * Catalog of all of the aspect types available in our system
   * @type {AspectTypeArray}
   */
  var types = {
    'conjunct': { name: 'conjunct', major: true, angle: 0, orb: 7, symbol: '<' },
    'semisextile': { name: 'semisextile', major: false, angle: 30, orb: 3, symbol: 'y' },
    'decile': { name: 'decile', major: false, angle: 36, orb: 1.5, symbol: '>' },
    // 'novile': {name:'novile', major: false, angle: 40, orb: 1.9, symbol: 'M' },
    'semisquare': { name: 'semisquare', major: false, angle: 45, orb: 3, symbol: '=' },
    // 'septile': {name:'septile', major: false, angle: 51.417, orb: 2, symbol: 'V' },
    'sextile': { name: 'sextile', major: true, angle: 60, orb: 5, symbol: 'x' },
    'quintile': { name: 'quintile', major: false, angle: 72, orb: 2, symbol: 'Y' },
    // 'bilin': {name:'bilin', major: false, angle: 75, orb: 0.9, symbol: '-' },
    // 'binovile': {name:'binovile', major: false, angle: 80, orb: 2, symbol: ';' },
    'square': { name: 'square', major: true, angle: 90, orb: 6, symbol: 'c' },
    // 'biseptile': {name:'biseptile', major: false, angle: 102.851, orb: 2, symbol: 'N' },
    // 'tredecile': {name:'tredecile', major: false, angle: 108, orb: 2, symbol: 'X' },
    'trine': { name: 'trine', major: true, angle: 120, orb: 6, symbol: 'Q' },
    'sesquare': { name: 'sesquare', major: false, angle: 135, orb: 3, symbol: 'b' },
    'biquintile': { name: 'biquintile', major: false, angle: 144, orb: 2, symbol: 'C' },
    'inconjunct': { name: 'inconjunct', major: false, angle: 150, orb: 3, symbol: 'n' },
    // 'treseptile': {name:'treseptile', major: false, angle: 154.284, orb: 1.1, symbol: 'B' },
    // 'tetranovile': {name:'tetranovile', major: false, angle: 160, orb: 3, symbol: ':' },
    // 'tao': {name:'tao', major: false, angle: 165, orb: 1.5, symbol: '—' },
    'opposition': { name: 'opposition', major: true, angle: 180, orb: 6, symbol: 'm' }
  };
  // get key properties of the planets
  var l1 = p1.longitude,
    l2 = p2.longitude,
    ng = Math.abs(l1 - l2),
    r1 = isRetrograde(p1),
    r2 = isRetrograde(p2),
    s1 = Math.abs(p1.speed),
    s2 = Math.abs(p2.speed),
    ct = false; // corrected?
  // correct for cases where the angle > 180 + the orb of opposition
  if (ng > 180 + types['opposition'].orb) {
    ng = l1 > l2 ? 360 - l1 + l2 : 360 - l2 + l1;
    ct = true;
  }
  // determine the aspect type
  var pType = null;
  for (var type in types) {
    var t = types[type];
    if (ng >= t.angle - t.orb && ng <= t.angle + t.orb) {
      pType = type;
    }
  }
  // bail out if there is no in-orb aspect between these two planets
  if (pType === null) {
    throw new Error('There is no aspect between these two planets.');
  }
  // determine the orb
  //this._orb = Number((ng % 1).toFixed(6));
  // determine if it is applying or not; use speed magnitude (i.e. absolute value)
  var orb = ng - types[pType].angle;
  // planets are in aspect across 0° Aries
  var applying = false;
  if ((orb < 0 && !ct && l2 > l1 || orb > 0 && !ct && l1 > l2 || orb < 0 && ct && l1 > l2 || orb > 0 && ct && l2 > l1) && (!r1 && !r2 && s2 > s1 || r1 && r2 && s1 > s2 || r1 && !r2) || (orb > 0 && !ct && l2 > l1 || orb < 0 && !ct && l1 > l2 || orb > 0 && ct && l1 > l2 || orb < 0 && ct && l2 > l1) && (!r1 && !r2 && s1 > s2 || r1 && r2 && s2 > s1 || !r1 && r2)) {
    applying = true;
  }
  if (!applying) {
    return null;
  }
  var aspect = {
    'type': pType.name,
    'orb': orb
  };
  return aspect;
}


var planetsData = {
  'sun': {
    'name': 'sun',
    'lon': 316.81797600093626,
    'lat': 0.0004108106661321218,
    'spd': 1.0098260642621426,
    'r': 0
  },
  'moon': {
    'name': 'moon',
    'lon': 326.0242175662381,
    'lat': -1.2666176621572691,
    'spd': 11.784215357124594,
    'r': 0
  },
  'mercury': {
    'name': 'mercury',
    'lon': 334.2201905101414,
    'lat': 1.3454868374151474,
    'spd': 0.48104779438062906,
    'r': 0
  },
  'venus': {
    'name': 'venus',
    'lon': 301.8172830238122,
    'lat': -0.633749811484642,
    'spd': 1.2511515060964484,
    'r': 0
  },
  'mars': {
    'name': 'mars',
    'lon': 329.01665019172503,
    'lat': -1.0414450814576528,
    'spd': 0.7880249228264802,
    'r': 0
  },
  'jupiter': {
    'name': 'jupiter',
    'lon': 190.16361397054163,
    'lat': 1.4654571685733873,
    'spd': -0.03487566175408574,
    'r': 0
  },
  'saturn': {
    'name': 'saturn',
    'lon': 189.4960389523151,
    'lat': 2.5208657429238936,
    'spd': -0.029923668733999875,
    'r': 0
  },
  'uranus': {
    'name': 'uranus',
    'lon': 239.77387282404084,
    'lat': 0.22525176978027348,
    'spd': 0.024867982375553765,
    'r': 0
  },
  'neptune': {
    'name': 'neptune',
    'lon': 264.1927105872144,
    'lat': 1.3089504736466098,
    'spd': 0.02563382736298081,
    'r': 0
  },
  'pluto': {
    'name': 'pluto',
    'lon': 204.31516118590744,
    'lat': 17.343013961732847,
    'spd': -0.005452316997889284,
    'r': 0
  },
  'mean_node': {
    'name': 'mean_node',
    'lon': 130.62312516773838,
    'lat': 0,
    'spd': -0.05296177377545064,
    'r': 0
  }
  // 'chiron': {
  //   'name': 'chiron',
  //   'lon': 43.5052345101053,
  //   'lat': -2.11740419283264,
  //   'spd': 0.013930854869670384,
  //   'r': 0
  // },
  // 'pholus': {
  //   'name': 'pholus',
  //   'lon': 359.2381717864676,
  //   'lat': -21.31818577049128,
  //   'spd': 0.056111419439730525,
  //   'r': 0
  // },
  // 'ceres': {
  //   'name': 'ceres',
  //   'lon': 105.24143734697998,
  //   'lat': 9.622921376999386,
  //   'spd': -0.1523610105635953,
  //   'r': 0
  // },
  // 'pallas': {
  //   'name': 'pallas',
  //   'lon': 28.182609745094318,
  //   'lat': -30.62175266741695,
  //   'spd': 0.37003767719312464,
  //   'r': 0
  // },
  // 'juno': {
  //   'name': 'juno',
  //   'lon': 216.89360101511954,
  //   'lat': 6.977622611331037,
  //   'spd': 0.10345614541051873,
  //   'r': 0
  // },
  // 'vesta': {
  //   'name': 'vesta',
  //   'lon': 157.20224800433607,
  //   'lat': 8.371002154803717,
  //   'spd': -0.20587487782108838,
  //   'r': 0
  // },
  // 'cupido': {
  //   'name': 'cupido',
  //   'lon': 218.1866086023104,
  //   'lat': 1.077466224606196,
  //   'spd': 0.0007074584118527127,
  //   'r': 0
  // },
  // 'chariklo': {
  //   'name': 'chariklo',
  //   'lon': 34.98530189104559,
  //   'lat': 22.96795814372611,
  //   'spd': 0.024017344628646242,
  //   'r': 0
  // },
  // 'chaos': {
  //   'name': 'chaos',
  //   'lon': 32.45982525521509,
  //   'lat': -3.3494148329201727,
  //   'spd': 0.00839405903008128,
  //   'r': 0
  // },
  // 'eris': {
  //   'name': 'eris',
  //   'lon': 14.207630934323765,
  //   'lat': -18.973085727365532,
  //   'spd': 0.005986353714959591,
  //   'r': 0
  // },
  // 'nessus': {
  //   'name': 'nessus',
  //   'lon': 110.99714757927057,
  //   'lat': 16.279877634271934,
  //   'spd': -0.041067750800038993,
  //   'r': 0
  // }
};
var aspectCreate = function(planetsData, asc, mc) {

  var result = []; //[[aspectType,orb,applying]]
  var sortFn = function(a, b) {
    return a.angle - b.angle;
  };
  var isRetrograde = function(p) {
    return p.speed < 0;
  };
  var samePair = {};


  planetsData['asc'] = {
    'name': 'asc',
    'lon': asc
  };
  planetsData['mc'] = {
    'name': 'mc',
    'lon': mc
  };

  for (var aName in planetsData) {
    var p1 = planetsData[aName];
    for (var bName in planetsData) {
      var p2 = planetsData[bName];
      if (p1.name === p2.name) {
        continue;
      }
      if (samePair[p1.name + '#' + p2.name]) {
        //already done.
        continue;
      }
      samePair[p2.name + '#' + p1.name] = true;
      var aspectTypes = [
        { name: 'conjunct', major: true, angle: 0, orb: 8, symbol: '<' },
        { name: 'semisextile', major: false, angle: 30, orb: 2, symbol: 'y' },
        // { name: 'decile', major: false, angle: 36, orb: 1.5, symbol: '>' },
        //// {name:'novile', major: false, angle: 40, orb: 1.9, symbol: 'M' },
        { name: 'semisquare', major: false, angle: 45, orb: 2, symbol: '=' },
        //// {name:'septile', major: false, angle: 51.417, orb: 2, symbol: 'V' },
        { name: 'sextile', major: true, angle: 60, orb: 5, symbol: 'x' },
        // { name: 'quintile', major: false, angle: 72, orb: 2, symbol: 'Y' },
        //// {name:'bilin', major: false, angle: 75, orb: 0.9, symbol: '-' },
        //// {name:'binovile', major: false, angle: 80, orb: 2, symbol: ';' },
        { name: 'square', major: true, angle: 90, orb: 6, symbol: 'c' },
        //// {name:'biseptile', major: false, angle: 102.851, orb: 2, symbol: 'N' },
        //// {name:'tredecile', major: false, angle: 108, orb: 2, symbol: 'X' },
        { name: 'trine', major: true, angle: 120, orb: 7, symbol: 'Q' },
        // { name: 'sesquare', major: false, angle: 135, orb: 2, symbol: 'b' },
        // { name: 'biquintile', major: false, angle: 144, orb: 2, symbol: 'C' },
        // { name: 'inconjunct', major: false, angle: 150, orb: 2, symbol: 'n' },
        //// {name:'treseptile', major: false, angle: 154.284, orb: 1.1, symbol: 'B' },
        //// {name:'tetranovile', major: false, angle: 160, orb: 3, symbol: ':' },
        //// {name:'tao', major: false, angle: 165, orb: 1.5, symbol: '—' },
        { name: 'opposition', major: true, angle: 180, orb: 7, symbol: 'm' }
      ];
      var l1 = p1.lon,
        l2 = p2.lon,
        r1 = isRetrograde(p1),
        r2 = isRetrograde(p2),
        s1 = Math.abs(p1.spd),
        s2 = Math.abs(p2.spd);
      var ct = false;
      var distAngle = Math.abs(p1.lon - p2.lon);
      if (distAngle > 180 + aspectTypes[aspectTypes.length - 1].orb) {
        distAngle = l1 > l2 ? (360 - l1 + l2) : (360 - l2 + l1);
        ct = true;
      }
      //applying or separating
      var applying = 0;
      if (p2.spd && p1.spd) {
        if ((distAngle < 0 && !ct && l2 > l1 || distAngle > 0 && !ct && l1 > l2 || distAngle < 0 && ct && l1 > l2 || distAngle > 0 && ct && l2 > l1) && (!r1 && !r2 && s2 > s1 || r1 && r2 && s1 > s2 || r1 && !r2) || (distAngle > 0 && !ct && l2 > l1 || distAngle < 0 && !ct && l1 > l2 || distAngle > 0 && ct && l1 > l2 || distAngle < 0 && ct && l2 > l1) && (!r1 && !r2 && s1 > s2 || r1 && r2 && s2 > s1 || !r1 && r2)) {
          applying = 1;
        } else {
          applying = -1;
        }
      }

      var compareObj = { 'name': 'target', 'angle': distAngle };
      aspectTypes.push(compareObj);
      aspectTypes.sort(sortFn);
      // console.log(aspectTypes);
      for (var i = 0; i < aspectTypes.length; i++) {
        var cur = aspectTypes[i];
        if (cur.name === 'target') {
          var pre = aspectTypes[i - 1];
          var next = aspectTypes[i + 1];
          if (pre.angle + pre.orb > cur.angle) {
            //match pre
            result.push([pre.name, p1.name, p2.name, cur.angle - pre.angle, applying]);
            break;
          }
          if (next.angle - next.orb < cur.angle) {
            //match next
            result.push([next.name, p1.name, p2.name, next.angle - cur.angle, applying]);
            break;
          }
          // console.log('--- not match:%j',[p1.name,p2.name]);
          break;
        }
      }
    }
  }
  console.log('aspect result:------->', result.length);
  console.log(result);
};
aspectCreate(planetsData, 225.38677571201202, 144.74309363455245);

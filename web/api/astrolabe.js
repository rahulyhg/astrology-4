/*
astrolabe的api
 */
'use strict';
var kc = require('kc');
var iApi = kc.iApi;
var error = require('./../error');
var vlog = require('vlog').instance(__filename);
var swisseph = require('swisseph-new');

//标准API协议所用到的key,可根据情况从配置文件,数据库或其他位置获取,这里仅作为示例
var apiKey = 'testKey';


var toDegree = function(s) {
  if (s === undefined || s === null) {
    return '';
  }
  var pre = '';
  if (s < 0.0) {
    s = -s;
    pre = '-';
  }
  var d = Math.floor(s);
  s -= d;
  s *= 60;
  var m = Math.floor(s);
  s -= m;
  s *= 60;
  return pre + d + '°' + m + '\'' + Math.floor(s);
};


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
  'SE_MEAN_NODE'
  // 'SE_CHIRON',
  // 'SE_PHOLUS',
  // 'SE_CERES',
  // 'SE_PALLAS',
  // 'SE_JUNO',
  // 'SE_VESTA',
  // 'SE_CUPIDO'
  // swisseph.SE_AST_OFFSET + 10199,  // chariklo
  // swisseph.SE_AST_OFFSET + 19521,  // chaos
  // swisseph.SE_AST_OFFSET + 136199, // eris
  // swisseph.SE_AST_OFFSET + 7066    // nessus
];


var queryAdtroData = function(date, timeZone, geoLon, geoLat, splitHouses) {
  // console.log('date:%j',date,timeZone);
  swisseph.swe_utc_time_zone(date.year, date.month, date.day, date.hour, date.minute, date.second, timeZone, function(re) {
    date = re;
    // console.log('Date from 8 Time Zone:', re, date);
  });
  // Julian day
  var julday_ut = 0;


  swisseph.swe_utc_to_jd(date.year, date.month, date.day, date.hour, date.minute, date.second, swisseph.SE_GREG_CAL, function(re) {
    julday_ut = re.julianDayUT;
    // console.log('swe_utc_to_jd:%j',julday_ut);
  });
  // swisseph.swe_julday(date.year, date.month, date.day, date.hour, swisseph.SE_GREG_CAL, function(re) {
  //   julday_ut = re;
  //   console.log('Julian UT day for date:', julday_ut);
  // });
  // var flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_TOPOCTR;
  // swisseph.swe_set_topo(0, 0, 0);
  var flag = swisseph.SEFLG_SPEED;
  var outAll = {};
  var planets = {};
  for (var i = 0; i < ephs.length; i++) {
    var tag = ephs[i].substring(3);
    var tagEph = swisseph[ephs[i]];
    swisseph.swe_calc_ut(julday_ut, tagEph, flag, function(body) {
      // console.log('%j position:%j , \ndegree:%j \n', tag, body, toDegree(body.longitude));
      var out = {};
      out.name = tag.toLowerCase();
      out.lon = body.longitude;
      out.lat = body.latitude;
      out.spd = body.longitudeSpeed;
      // out.r = (body.longitudeSpeed[3] < 0) ? 1 : 0;
      planets[tag.toLowerCase()] = out;
    });
  }
  // console.log('julday_ut:%j,geoLon:%j,geoLat:%j,splitHouses:%j',julday_ut,geoLat,geoLon,splitHouses);

  swisseph.swe_houses(julday_ut, geoLat, geoLon, splitHouses, function(result) {
    if (result.error) {
      vlog.eo(result.error, 'swe_houses', julday_ut, geoLat, geoLon);
      return;
    }
    outAll['houses'] = result.house;
    planets['asc'] = {
      'name': 'asc',
      'lon': result.ascendant
    };
    planets['mc'] = {
      'name': 'mc',
      'lon': result.mc
    };
    // console.log('Houses for date:', result);
    // console.log('house degree:%j', toDegree(result.ascendant), toDegree(result.mc));
    outAll['planets'] = planets;
    outAll['asc'] = result.ascendant;
    outAll['mc'] = result.mc;
  });
  return outAll;
};


var checkOnePlanetLocation = function(lon, circleArr) {
  var len = circleArr.length;
  for (var i = 0; i < len; i++) {
    var a = circleArr[i];
    var b = circleArr[i + 1];
    if (lon >= a && lon < b) {
      return i;
    }
  }
  return len - 1;
};

/**
 * planets in sign, house, etc.
 * @param  {float} asc
 * @param  {array} houses
 * @param  {object} planets
 * @return {object} planets
 */
var planetsCount = function(asc, houses, planets) {
  var eclipticArr = [];
  for (var i = 0; i < 12; i++) {
    eclipticArr.push(i * 30);
  }
  var eclipticTxtArr = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];

  for (var j in planets) {
    var lon = planets[j].lon;
    var eclipticPo = checkOnePlanetLocation(lon, eclipticArr);
    planets[j].inSign = eclipticTxtArr[eclipticPo];
    planets[j].inSignPo = eclipticPo;
    planets[j].inSignAngle = toDegree(lon - eclipticArr[eclipticPo]);
    var housePo = checkOnePlanetLocation(lon, houses);
    planets[j].inHouse = housePo + 1;
    planets[j].inHouseAngle = toDegree(lon - houses[housePo]);
  }
  return planets;
};



var elementMap = {
  '双鱼': 'water',
  '水瓶': 'air',
  '摩羯': 'earth',
  '射手': 'fire',
  '天蝎': 'water',
  '天秤': 'air',
  '处女': 'earth',
  '狮子': 'fire',
  '巨蟹': 'water',
  '双子': 'air',
  '金牛': 'earth',
  '白羊': 'fire'
};
var eleValiPlanets = {
  'sun': true,
  'moon': true,
  'mercury': true,
  'venus': true,
  'mars': true,
  'jupiter': true,
  'saturn': true,
  'uranus': true,
  'neptune': true,
  'pluto': true,
  'asc': true,
  'mc': true
};
/*
four element, from planets in signs
 */
var elementCount = function(countedPlanets) {
  var out = {
    'fire': 0,
    'water': 0,
    'earth': 0,
    'air': 0
  };
  for (var i in countedPlanets) {
    if (!eleValiPlanets[i]) {
      continue;
    }
    var obj = countedPlanets[i];
    out[elementMap[obj.inSign]]++;
  }
  return out;
};


var aspectCount = function(planetsData) {

  var result = []; //[[aspectType,orb,applying]]
  var sortFn = function(a, b) {
    return a.angle - b.angle;
  };
  var isRetrograde = function(p) {
    return p.speed < 0;
  };
  var samePair = {};

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
        { name: 'conjunct', major: true, angle: 0, orb: 7, symbol: '<' },
        { name: 'semisextile', major: false, angle: 30, orb: 1, symbol: 'y' },
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
        { name: 'trine', major: true, angle: 120, orb: 6, symbol: 'Q' },
        // { name: 'sesquare', major: false, angle: 135, orb: 2, symbol: 'b' },
        // { name: 'biquintile', major: false, angle: 144, orb: 2, symbol: 'C' },
        // { name: 'inconjunct', major: false, angle: 150, orb: 2, symbol: 'n' },
        //// {name:'treseptile', major: false, angle: 154.284, orb: 1.1, symbol: 'B' },
        //// {name:'tetranovile', major: false, angle: 160, orb: 3, symbol: ':' },
        //// {name:'tao', major: false, angle: 165, orb: 1.5, symbol: '—' },
        { name: 'opposition', major: true, angle: 180, orb: 6, symbol: 'm' }
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

      var compareObj = {
        'name': 'target',
        'angle': distAngle
      };
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
  // console.log('aspect result:------->', result.length);
  return result;
};


var countAstroData = function(astroDatas) {
  var countedPlanets = planetsCount(astroDatas.asc, astroDatas.houses, astroDatas.planets);
  astroDatas.planets = countedPlanets;
  astroDatas.elements = elementCount(countedPlanets);
  astroDatas.aspects = aspectCount(astroDatas.planets);
  return astroDatas;
};

/**
 * query astrolabe json data
 * @param  {http.req}   req
 * @param  {http.resp}   resp
 * @param  {Function} callback
 * @return {}
 */
var query = function(req, resp, callback) {
  /*
   * 解析标准API请求并校验签名
   * @param  {json} data 请求的json数据
   * @param  {string} key  签名校验的key
   * @return {json}      返回请求中的req部分,失败则返回null
   */
  var reqDataArr = iApi.parseApiReq(req.body, apiKey);
  if (reqDataArr[0] !== 0) {
    //如果报错时,可定义状态码和返回错误码,如下403表示http返回403状态码,iiReq会返回错误error.json['iiReq']的内容
    return callback(vlog.ee(new Error('iApi req'), 'kc iApi req error', reqDataArr), null, 200, reqDataArr[0]);
  }
  var reqData = reqDataArr[1];
  var timeZone = parseInt(reqData.timeZone) || 8;
  var splitHouses = reqData.splitHouses || 'P';
  var geoLon = parseFloat(reqData.geoLon);
  var geoLat = parseFloat(reqData.geoLat);
  var date = { year: parseInt(reqData.birthYear), month: parseInt(reqData.birtMonth), day: parseInt(reqData.birthDate), hour: parseInt(reqData.birthHours), minute: parseInt(reqData.birthMinutes), second: parseInt(reqData.birthSeconds) };
  // console.log(date, timeZone, geoLon, geoLat, splitHouses);
  var outAll = queryAdtroData(date, timeZone, geoLon, geoLat, splitHouses);

  // var countedPlanets = planetsCount(outAll.asc, outAll.houses, outAll.planets);
  // outAll.planets = countedPlanets;
  // outAll.elements = elementCount(countedPlanets);
  // outAll.aspects = aspectCount(outAll.planets);

  outAll = countAstroData(outAll);
  // console.log(outAll);
  /*
   * iApi.makeApiResp:创建resp的内容
   * @param  {int} errorCode      0为成功,其他为错误码
   * @param  {object} data   返回的数据,格式不限
   * @param  {string} apiKey 用于校验请求合法性的key
   * @return {json} 需要返回的json
   */
  var respObj = iApi.makeApiResp(0, outAll, apiKey);
  //返回
  callback(null, respObj);
};



var iiConfig = {
  'auth': false, //[auth]:是否需要登录验证,默认需要auth,除非配置强制设置为false
  // 'validatorFailStateCode':403, //[validatorFailStateCode]:当validator验证失败时返回的http状态码,默认为200,此处可以进行全局修改
  // 'type': 'application/json', //[type]:http请求头的type,可选,默认'application/json'
  'act': {
    //另一个接口,地址如:http://localhost:16000/astrolabe/query
    'query': {
      'validator': {
        '@userName': 'string',
        'birthYear': 'strInt',
        'birtMonth': 'strInt',
        'birthDate': 'strInt',
        'birthHours': 'strInt',
        'birthMinutes': 'strInt',
        'birthSeconds': 'strInt',
        'geoLon': 'string',
        'geoLat': 'string',
        '@splitHouses': ['strLen', [0, 1]],
        '@timeZone': ['strIntRange', [0, 30]]
      },
      'resp': query
    }
  }
};

exports.router = function() {

  //由以上配置生成router
  var router = iApi.getRouter(iiConfig);

  //声明get方式的响应,可以在此使用tpls中的模板
  /*
  router.get('/get1', function(req, resp, next) {
    resp.send(render.login({title:'登录'}));
  });
  */
  router.get('*', function(req, resp, next) {
    resp.status(404).send(error.json('404', 'astrolabe'));
  });
  return router;
};



exports.queryAdtroData = queryAdtroData;
exports.countAstroData = countAstroData;
exports.toDegree = toDegree;


// var date = { year: 1981, month: 2, day: 6, hour: 1, minute: 0, second: 0 };
// var re = queryAdtroData(date,8,23.33,55.23,'P');
// console.log(re);

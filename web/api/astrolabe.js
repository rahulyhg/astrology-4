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

/**
 * 子接口方法,callback第二个参数即为resp返回的body
 * @param  {http.req}   req
 * @param  {http.resp}   resp
 * @param  {Function} callback 接口响应回调
 * @return {void}
 */
var test = function(req, resp, callback) {
  var re = { 'hello': '你好' };
  callback(null, { 're': 0, 'data': re });
};


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


var queryAdtroData = function(date,timeZone,geoLon,geoLat,splitHouses) {
  // console.log('date:%j',date,timeZone);
  swisseph.swe_utc_time_zone(date.year, date.month, date.day, date.hour, date.minute, date.second, timeZone, function(re) {
    date = re;
    // console.log('Date from 8 Time Zone:', re, date);
  });
  // Julian day
  var julday_ut = 0;


  swisseph.swe_utc_to_jd(date.year, date.month, date.day, date.hour, date.minute, date.second,swisseph.SE_GREG_CAL,function (re) {
    julday_ut = re.julianDayUT;
    // console.log('swe_utc_to_jd:%j',re);
  });
  // swisseph.swe_julday(date.year, date.month, date.day, date.hour, swisseph.SE_GREG_CAL, function(re) {
  //   julday_ut = re;
  //   console.log('Julian UT day for date:', julday_ut);
  // });
  var flag = swisseph.SEFLG_SPEED | swisseph.SEFLG_MOSEPH | swisseph.SEFLG_TOPOCTR;
  swisseph.swe_set_topo(0, 0, 0);

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
      vlog.eo(result.error,'swe_houses',julday_ut, geoLat, geoLon);
      return;
    }
    outAll['houses'] = result.house;
    planets['asc'] = {
      'name':'asc',
      'lon':result.ascendant
    };
    planets['mc'] = {
      'name':'mc',
      'lon':result.mc
    };
    // console.log('Houses for date:', result);
    // console.log('house degree:%j', toDegree(result.ascendant), toDegree(result.mc));
    outAll['planets'] = planets;
    outAll['asc'] = result.ascendant;
    outAll['mc'] = result.mc;
  });
  return outAll;
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
  var geoLon = parseInt(reqData.geoLon);
  var geoLat = parseInt(reqData.geoLat);
  var date = { year: parseInt(reqData.birthYear), month: parseInt(reqData.birtMonth), day: parseInt(reqData.birthDate), hour: parseInt(reqData.birthHours), minute: parseInt(reqData.birthMinutes), second: parseInt(reqData.birthSeconds) };

  var outAll = queryAdtroData(date,timeZone,geoLon,geoLat,splitHouses);
  // console.log('outAll:%j',outAll);
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
    //接口1,地址如:http://localhost:16000/astrolabe/testAct
    'test': {
      /*
      'showLevel': 0, //[showLevel]:如果需要验证,此处为用户最可访问的最低level,可选,默认0
      'validator': { //[validator]:参数校验器,可选
        'phone': 'mobileCN', //手机号参数验证示例,详细校验参数可参见cck项目
        'age': ['intRang', [10, 100]], //数字范围验证示例
        '@state': ['intRang', [0, 99]], //带@符号开头的参数表示此字段可以不存在,如存在则按此条件校验
        'txt': function(inputVal) { //自定义校验方法,return true为通过
          if (inputVal === 'hello') {
            return true;
          } else {
            return false;
          }
        }
      },
      */
      'resp': test //接口实现方法,必须有
    },
    //另一个接口,地址如:http://localhost:16000/astrolabe/query
    'query': {
      'validator':{
        '@userName':'string',
        'birthYear':'strInt',
        'birtMonth':'strInt',
        'birthDate':'strInt',
        'birthHours':'strInt',
        'birthMinutes':'strInt',
        'birthSeconds':'strInt',
        'geoLon':'string',
        'geoLat':'string',
        '@splitHouses':['strLen',[0,1]],
        '@timeZone':['strIntRange', [0, 30]]
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
// var date = { year: 1981, month: 2, day: 6, hour: 1, minute: 0, second: 0 };
// var re = queryAdtroData(date,8,23.33,55.23,'P');
// console.log(re);

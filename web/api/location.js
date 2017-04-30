/*
用户的api
 */
'use strict';
var kc = require('kc');
var url = require('url');
var iApi = kc.iApi;
var mongo = kc.mongo;
var error = require('./../error');
var vlog = require('vlog').instance(__filename);

var locationTable = 'cityLocation';
var cityCache = {};
var countryCache = {};
var cachedCountry = {};
var isInit = false;




var setCache = function(cacheTarget, key, val) {
  key = key.toLowerCase();
  if (!cacheTarget[key]) {
    cacheTarget[key] = [val];
    return;
  }
  cacheTarget[key].push(val);
};

var setCityCache = function(cityObj) {
  var key = cityObj.shortIndex;
  if (key.length <= 1) {
    setCache(cityCache, cityObj.country + ':' + key, cityObj);
    return;
  }
  var k = '' + key.charAt(0);
  for (var i = 1; i < key.length; i++) {
    k += key.charAt(i);
    setCache(cityCache, cityObj.country + ':' + k, cityObj);
  }
};

var setCountryCache = function(cityObj) {
  if (cachedCountry[cityObj.country]) {
    return;
  }
  cachedCountry[cityObj.country] = true;
  var key = cityObj.country.toLowerCase();
  var k = '' + key.charAt(0);
  for (var i = 1; i < key.length; i++) {
    k += key.charAt(i);
    setCache(countryCache, k, cityObj.country);
  }
};

var init = function() {
  if (isInit) {
    return;
  }
  isInit = true;
  mongo.queryFromDb(locationTable, {}, { limit: 999999 }, function(err, re) {
    if (err) {
      vlog.eo(err, 'cacheLocations');
      return;
    }
    for (var i = 0; i < re.length; i++) {
      setCityCache(re[i]);
      setCountryCache(re[i]);
    }
    vlog.log('[location] cache loaded.');
  });
};

/**
 * 快速定位city
 */
var cityFind = function(reqUrl, callback) {
  var query = url.parse(reqUrl, true).query;
  if (!query || !query.q || !query.c) {
    return callback(null, { 're': -1, 'data': 'nok' });
  }
  var queryKey = query.c.toLowerCase() + ':' + query.q.toLowerCase();
  var cityObjArr = cityCache[queryKey];
  if (!cityObjArr) {
    return callback(null, { 're': -2, 'data': '' });
  }
  var outArr = [];
  for (var i = 0; i < cityObjArr.length; i++) {
    var province = cityObjArr[i].province || '';
    var outObj = { 'city': cityObjArr[i].city, 'country': cityObjArr[i].country, 'province': province, 'geo': cityObjArr[i].lon + ',' + cityObjArr[i].lat };
    outObj.showTxt = outObj.city + '/' + (province ? (province + '/') : '') + outObj.country;
    outArr.push(outObj);
  }
  callback(null, { 're': 0, 'data': outArr });
};

/**
 * 快速定位country
 */
var countryFind = function(reqUrl, callback) {
  var query = url.parse(reqUrl, true).query;
  if (!query || !query.q) {
    return callback(null, { 're': -1, 'data': 'nok' });
  }
  var queryKey = query.q.toLowerCase();
  var countryObjArr = countryCache[queryKey];
  if (!countryObjArr) {
    return callback(null, { 're': -2, 'data': '' });
  }
  callback(null, { 're': 0, 'data': countryObjArr });
};



var iiConfig = {
  'auth': false, //[auth]:是否需要登录验证,默认需要auth,除非配置强制设置为false
  // 'validatorFailStateCode':403, //[validatorFailStateCode]:当validator验证失败时返回的http状态码,默认为200,此处可以进行全局修改
  // 'type': 'application/json', //[type]:http请求头的type,可选,默认'application/json'
  'act': {}
};




exports.router = function() {

  //由以上配置生成router
  var router = iApi.getRouter(iiConfig);

  //声明get方式的响应,可以在此使用tpls中的模板

  router.get('/city', function(req, resp, next) {
    cityFind(req.url, function(err, re) {
      if (err) {
        vlog.eo(err, 'cityFind', req.url);
        return;
      }
      resp.send(JSON.stringify(re));
    });
  });

  router.get('/country', function(req, resp, next) {
    countryFind(req.url, function(err, re) {
      if (err) {
        vlog.eo(err, 'countryFind', req.url);
        return;
      }
      resp.send(JSON.stringify(re));
    });
  });

  router.get('*', function(req, resp, next) {
    resp.status(404).send(error.json('404', '404001'));
  });
  return router;
};

init();

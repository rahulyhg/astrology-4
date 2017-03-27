/*
抓取star数据

[Sun,太阳,M],
[Moon,月亮,N],
[Mercury,水星,O],
[Venus,金星,P],
[Mars,火星,Q],
[Jupiter,木星,R],
[Saturn,土星,S],
[Uranus,天王星,T],
[Neptune,海王星,U],
[Pluto,冥王星,V]

1.Aquarius(the Water Carrier)水瓶座
2.Pisces(the Fishes)双鱼座
3.Aries(the Ram)白羊座
4.Taurus(the Bull)金牛座
5.Gemini(the Twins)双子座
6.Cancer(the Crab)巨蟹座
7.Leo(the Lion)狮子座
8.Virgo(the Virgin)处女座
9.Libra(the Scales)天秤座
10.Scorpio(the Scorpion)天蝎座
11.Sagittarius(the Archer)射手座
12.Capricorn(the Goat)山羊座
 */
'use strict';

var cheerio = require('cheerio');
var request = require('request');
var iconv = require('iconv-lite');
var vlog = require('vlog').instance(__filename);
var kc = require('kc');
var mongo = kc.mongo;


var trans = {
  '入庙': 'Rulership',
  '旺相': 'Exaltation',
  '失势': 'Detriment',
  '落陷': 'Full',

  '水瓶': 'Aquarius',
  '双鱼': 'Pisces',
  '白羊': 'Aries',
  '金牛': 'Taurus',
  '双子': 'Gemini',
  '巨蟹': 'Cancer',
  '狮子': 'Leo',
  '处女': 'Virgo',
  '天秤': 'Libra',
  '天蝎': 'Scorpio',
  '射手': 'Sagittarius',
  '山羊': 'Capricorn',

  '太阳': 'Sun',
  '月亮': 'Moon',
  '水星': 'Mercury',
  '金星': 'Venus',
  '火星': 'Mars',
  '木星': 'Jupiter',
  '土星': 'Saturn',
  '天王星': 'Uranus',
  '海王星': 'Neptune',
  '冥王星': 'Pluto'
};

var pSplit = '\r\n';
var zodiacTable = 'zodiac';

// var reqUrl = 'http://www.12sign.cn/bm/201.html';
// var reqUrl = 'https://xp.ixingpan.com/xp.php?type=natal&name=%E6%98%B5%E7%A7%B0&sex=0&dist=2998&date=1981-02-06&time=01:05&dst=0&hsys=P#aspectlist';


var fetchZodiacs = function() {
  var urlPre = 'http://www.12sign.cn/bm/';
  var iArr = ['201', '200', '199', '198', '197', '196', '195', '204', '211', '210', '209', '208'];
  for (var i = 0; i < iArr.length; i++) {
    var reqUrl = urlPre + iArr[i] + '.html';
    // console.log('reqUrl:%s',reqUrl);
    fetchOnePage(reqUrl,findInZodiac);
  }
};

var fetchOnePage = function(reqUrl, findFn) {
  request({ 'url': reqUrl, 'encoding': null }, function(error, response, body) {
    if (error) {
      console.error(error);
      return;
    }
    if (response.statusCode !== 200) {
      console.log('fail:%d,  body:%s', response.statusCode, body);
      return;
    }
    body = iconv.decode(body, 'gb2312');
    // console.log(body);
    var $ = cheerio.load(body, { decodeEntities: false });
    // console.log('===');
    // console.log($('.interpretation-header')['2']);
    var re = findFn($);
    console.log('url:%s done.', reqUrl);
    // console.log(re);
    mongo.logToDb(zodiacTable, re);
    // console.log('===');
  });
};

var findInHouse = function($) {
  var zodiacName = $('.page-header>h2').text().trim().replace('座', '');
  var planetsInZodiac = { 'zodiac': zodiacName, 'zodiacEn': trans[zodiacName] };
  var planetObj = {};
  var planetsInfoObj = {};
  var zodiacInfo = $('.page-header').next().find('p');
  var zodiacInfoTxt = zodiacInfo.eq(0).text().trim();
  planetsInZodiac.zodiacInfo = zodiacInfoTxt + pSplit;
  zodiacInfo.nextAll('p').each(function(i, elem) {
    // console.log($(this).html());
    var planetTitle = $(this).find('b');
    if (planetTitle.html()) {
      var planetInZodiacTitle = planetTitle.text().replace(/回页首/g, '').trim();
      var plusPo = planetInZodiacTitle.indexOf('（');
      var plusPosition = '';
      if (plusPo > 0) {
        plusPosition = planetInZodiacTitle.substring(plusPo + 1, planetInZodiacTitle.indexOf('）'));
        planetInZodiacTitle = planetInZodiacTitle.substring(0, plusPo);
      }
      if (planetObj.planetName) {
        planetsInfoObj[planetObj.planetNameEn] = planetObj;
      } else if (planetObj.inZodiacTxt1) {
        planetsInZodiac.zodiacInfo += planetObj.inZodiacTxt1;
      }

      planetObj = {};
      planetObj.planetName = planetInZodiacTitle.substring(0, planetInZodiacTitle.indexOf(planetsInZodiac.zodiac) - 1);
      planetObj.planetNameEn = trans[planetObj.planetName];
      planetObj.inZodiacPlus = plusPosition;
      planetObj.inZodiacPlusEn = trans[plusPosition] || '';
      planetObj.inZodiacTxt1 = '';
      planetTitle.empty();
      var txt = $(this).text().replace(/回页首/g, '').trim();
      if (txt.length > 0 && txt !== '&nbsp;') {
        planetObj.inZodiacTxt1 += txt + pSplit;
      }
      return;
    }
    var txt1 = $(this).text().trim();
    if (txt1.length > 0 && txt1 !== '&nbsp;') {
      if (!planetObj.inZodiacTxt1) {
        planetObj.inZodiacTxt1 = txt1 + pSplit;
      } else {
        planetObj.inZodiacTxt1 += txt1 + pSplit;
      }
    }
    // console.log('%d:---------', i);
  });
  planetsInZodiac.planets = planetsInfoObj;
  return planetsInZodiac;
};

var findInZodiac = function($) {
  var zodiacName = $('.page-header>h2').text().trim().replace('座', '');
  var planetsInZodiac = { 'zodiac': zodiacName, 'zodiacEn': trans[zodiacName] };
  var planetObj = {};
  var planetsInfoObj = {};
  var zodiacInfo = $('.page-header').next().find('p');
  var zodiacInfoTxt = zodiacInfo.eq(0).text().trim();
  planetsInZodiac.zodiacInfo = zodiacInfoTxt + pSplit;
  zodiacInfo.nextAll('p').each(function(i, elem) {
    // console.log($(this).html());
    var planetTitle = $(this).find('b');
    if (planetTitle.html()) {
      var planetInZodiacTitle = planetTitle.text().replace(/回页首/g, '').trim();
      var plusPo = planetInZodiacTitle.indexOf('（');
      var plusPosition = '';
      if (plusPo > 0) {
        plusPosition = planetInZodiacTitle.substring(plusPo + 1, planetInZodiacTitle.indexOf('）'));
        planetInZodiacTitle = planetInZodiacTitle.substring(0, plusPo);
      }
      if (planetObj.planetName) {
        planetsInfoObj[planetObj.planetNameEn] = planetObj;
      } else if (planetObj.inZodiacTxt1) {
        planetsInZodiac.zodiacInfo += planetObj.inZodiacTxt1;
      }

      planetObj = {};
      planetObj.planetName = planetInZodiacTitle.substring(0, planetInZodiacTitle.indexOf(planetsInZodiac.zodiac) - 1);
      planetObj.planetNameEn = trans[planetObj.planetName];
      planetObj.inZodiacPlus = plusPosition;
      planetObj.inZodiacPlusEn = trans[plusPosition] || '';
      planetObj.inZodiacTxt1 = '';
      planetTitle.empty();
      var txt = $(this).text().replace(/回页首/g, '').trim();
      if (txt.length > 0 && txt !== '&nbsp;') {
        planetObj.inZodiacTxt1 += txt + pSplit;
      }
      return;
    }
    var txt1 = $(this).text().trim();
    if (txt1.length > 0 && txt1 !== '&nbsp;') {
      if (!planetObj.inZodiacTxt1) {
        planetObj.inZodiacTxt1 = txt1 + pSplit;
      } else {
        planetObj.inZodiacTxt1 += txt1 + pSplit;
      }
    }
    // console.log('%d:---------', i);
  });
  planetsInZodiac.planets = planetsInfoObj;
  return planetsInZodiac;
};


mongo.init(__dirname + '/../config.json', function(err) {
  if (err) {
    vlog.eo(err, '');
    return;
  }
  console.log('start...');
  fetchZodiacs();
  // fetchOnePage('http://www.12sign.cn/bm/208.html');
});

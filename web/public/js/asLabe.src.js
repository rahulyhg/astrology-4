'use strict';

/**
 * 将某个点按某个位置旋转某度
 * @param  {int} centerX
 * @param  {int} centerY
 * @param  {int} orgX
 * @param  {int} orgY
 * @param  {float} rotateAngle
 * @return {array}             [newX,newY]
 */
var pointRotate = function(centerX, centerY, orgX, orgY, rotateAngle) {
  var x = orgX - centerX;
  var y = orgY - centerY;
  var l = (rotateAngle * Math.PI) / 180;
  var x1 = Math.cos(l) * x - Math.sin(l) * y;
  var y1 = Math.cos(l) * y + Math.sin(l) * x;
  return [x1 + centerX, y1 + centerY];
};

/**
 * 将点对象集合分散到一个圆上,根据dot.data(dotCircleName).lon进行角度旋转
 * @param  {string} dotCircleName 点名称,用于获取dot中的data
 * @param  {int} centerX    圆中心坐标X
 * @param  {int} centerY    圆中心坐标Y
 * @param  {array} dotArr     dot对象数组
 * @param  {int} radius     圆半径
 * @param  {int} ascAngle   asc线即水平线的角度,用于修正整个圆到水平
 * @return {array}            dot array
 */
var dotCircleCreate = function(dotCircleName, centerX, centerY, dotArr, radius, ascAngle) {
  // var groupDots = draw.group();
  var dotCircleArr = [];
  var fixAngle = ascAngle || 0;
  // rotate dots
  for (var i = 0; i < dotArr.length; i++) {
    var dotOne = dotArr[i];
    var pData = dotOne.data(dotCircleName);
    var newPosi = pointRotate(centerX, centerY, centerX - radius, centerY, 0 - pData.lon + fixAngle);
    dotOne.center(newPosi[0], newPosi[1]);
    dotCircleArr.push(dotOne);
  }
  return dotCircleArr;
};

var dotArrCreate = function(dotCircleName, dotOne, dotNameArr, dotData) {
  var dotArr = [];
  dotOne.data(dotCircleName, dotData[dotNameArr[0]]);
  dotArr.push(dotOne);

  for (var i = 1; i < dotNameArr.length; i++) {
    dotArr.push(dotOne.clone().data(dotCircleName, dotData[dotNameArr[i]]));
  }
  return dotArr;
};

var planetsCircle = function(draw, centerX, centerY, planets, planetsData, radius, ascAngle) {


  // var circle = draw.circle(radius * 2).fill('#ccc').stroke({
  //   width: 1,
  //   color: '#000'
  // }).center(centerX, centerY);
  // groupPlanets.add(circle);

  // create planet dots
  var dotRadius = 2;
  var dot = draw.circle(dotRadius * 2).fill('#e4e');
  var dotArr = dotArrCreate('planet', dot, planets, planetsData);
  // rotate dots
  var dotPlanetsArr = dotCircleCreate('planet', centerX, centerY, dotArr, radius, ascAngle);

  //center cross
  // var crossLen = 10;
  // var line1 = draw.line(0, 0, crossLen, 0).stroke({
  //   width: 0.5
  // }).center(centerX, centerY);
  // var line2 = draw.line(0, 0, 0, crossLen).stroke({
  //   width: 0.5
  // }).center(centerX, centerY);
  return dotPlanetsArr;
};

/**
 * txt circle
 * @param  {svg} draw
 * @param  {string} dotCircleName circleName
 * @param  {int} centerX       centerX
 * @param  {float} centerY       centerY
 * @param  {array} txts          ['a','b',...] or [['a',21],['b',16.5],['txt',(angle)]...]
 * @param  {object} fontStyle     font style
 * @param  {float} radius        radius
 * @param  {float} ascAngle      adjust angle
 * @return {array}               txt svg objects array
 */
var txtCircle = function(draw, dotCircleName, centerX, centerY, txts, fontStyle, radius, ascAngle) {
  var textObjs = [];
  var splitAngle = 360 / txts.length;
  for (var i = 0; i < txts.length; i++) {
    var txtItem = txts[i];
    var aTxt = txtItem;
    var cAngle = splitAngle * i;
    if (txtItem.constructor.name === 'Array') {
      aTxt = txtItem[0];
      cAngle = txtItem[1];
    }
    var txtOne = draw.text(aTxt).font(fontStyle).fill(fontStyle.color).data(dotCircleName, {
      'lon': cAngle
    });
    textObjs.push(txtOne);
  }
  var txtPlanetArr = dotCircleCreate(dotCircleName, centerX, centerY, textObjs, radius, ascAngle);
  return txtPlanetArr;
};

var distFromBBox = function(bbox1, bbox2) {
  var dx = bbox2.cx - bbox1.cx;
  var dy = bbox2.cy - bbox1.cy;
  var dist = Math.sqrt(dx * dx + dy * dy);
  return dist;
};

var hitTest = function(obj1, obj2) {
  var hitPadding = 4;
  var bbox1 = obj1.bbox();
  var bbox2 = obj2.bbox();
  var dist = distFromBBox(bbox1, bbox2);
  // console.log(dx+','+dy+',dist:'+dist+',width:'+bbox1.width+','+bbox2.width);

  //注意这里简单化使用width,准确的作法是使用bbox的直径,这里通过padding进行了容错
  return dist < (bbox1.width + bbox2.width + hitPadding) / 2;
};

var adjustCircleHitObj = function(obj1, obj2, centerX, centerY) {
  if (!hitTest(obj1, obj2)) {
    return false;
  }
  var changeAngle = 4;
  var bbox1 = obj1.bbox();
  var bbox2 = obj2.bbox();
  // var hitPadding = 6;
  // var goodDist = (bbox1.width + bbox2.width + hitPadding) / 2;
  //因为obj1和obj2是排过序的,所以,obj2需要顺时针方向调整,obj1逆时针调整

  // console.log(bbox1.x + ',' + bbox2.x + ',' + changeAngle);
  var newPo1 = pointRotate(centerX, centerY, bbox1.cx, bbox1.cy, 0 - changeAngle);
  obj1.center(newPo1[0], newPo1[1]);
  var newPo2 = pointRotate(centerX, centerY, bbox2.cx, bbox2.cy, changeAngle);
  obj2.center(newPo2[0], newPo2[1]);
  return true;
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
  console.log('aspect result:------->', result.length);
  // console.log(result);
  return result;
};


function astroShow(draw, showPlanets, planetsData, houseArr, asc, mc) {
  draw.clear();
  var maxSize = 500;
  var circleDiameter = 480;
  var centerX = circleDiameter / 2;
  var centerY = circleDiameter / 2;
  var padding = 10;
  var EclipticWidth = 80;
  draw.size('100%', '100%').viewbox(0, 0, maxSize, maxSize);
  // var bgColor = new SVG.Color('rgb(250, 253, 185 )');
  var bgColor = new SVG.Color('rgb(248,194,136)');
  var strokeColor = new SVG.Color('rgb(145,84,40)');
  var strokeColorBlue = new SVG.Color('rgb(34,108,162)');
  // var bgColorBlue = new SVG.Color('rgb(234,255,255)');
  var bgColorBlue = new SVG.Color('rgb(250,253,185)');
  var strokeWidth1 = 0.5;
  var strokeWidth2 = 1;
  var strokeStyleOuter = {
    width: 1.5,
    color: strokeColor
  };
  var strokeStyleInner = {
    width: strokeWidth1,
    color: strokeColorBlue
  };
  var strokeStyleInner2 = {
    width: strokeWidth2,
    color: strokeColorBlue
  };

  var groupAll = draw.group();

  var drawEcliptic = function() {

    var groupEcliptic = draw.group();
    //Ecliptic circles
    var circle1 = draw.circle(circleDiameter).fill(bgColor).stroke(strokeStyleOuter).center(centerX, centerY);
    var circle2 = draw.circle(circleDiameter - EclipticWidth).fill(bgColorBlue).center(centerX, centerY).stroke(strokeStyleOuter);


    //Ecliptic lines
    var lineEcliptic = draw.defs().line(0, 0, 0, circleDiameter).stroke(strokeStyleOuter).center(centerX, centerY);
    var lineEclipticGroup = draw.group();
    for (var i = 0; i < 12; i++) {
      var lineEclipticOne = draw.use(lineEcliptic).rotate(i * 30);
      lineEclipticGroup.add(lineEclipticOne);
    }



    //Ecliptic groupEcliptic
    groupEcliptic.add(circle1).add(lineEclipticGroup).add(circle2);
    return groupEcliptic;
  };

  var drawHouse = function() {
    var groupHouse = draw.group();
    //house
    var circle3 = draw.circle(circleDiameter - 120).fill('#FFF').center(centerX, centerY).stroke(strokeStyleInner2);
    var circle4 = circle3.clone().size(circleDiameter - 200).center(centerX, centerY);
    //House lines
    var lineHouse = draw.defs().line(0, 0, circleDiameter - EclipticWidth, 0).stroke(strokeStyleInner2).center(centerX, centerY);
    var lineHouseGroup = draw.group();

    for (var j = 0; j < houseArr.length; j++) {
      var lineHouseOne = draw.use(lineHouse).rotate(0 - houseArr[j]);
      lineHouseGroup.add(lineHouseOne);
    }
    var circleCenter = lineHouseGroup.clone().maskWith(circle3.clone().fill('#222').attr({
      stroke: null
    }));
    groupHouse.add(lineHouseGroup).add(circle3).add(circle4).add(circleCenter); //.add(lineStarGroup);

    return groupHouse;
  };

  // Ecliptic text circle
  var txtEclipticCircle = function(draw, centerX, centerY, radius, ascAngle) {
    var txtEclipticText = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    var fontStyle = {
      'size': 20,
      'font-family': 'astro',
      'color': 'red'
    };
    var fontStyle2 = {
      'size': 15,
      'font-family': 'astro',
      'color': 'green'
    };
    var txtEclipticRulerArr = ['Q', 'P', 'O', 'N', 'M', 'O', 'P', 'V', 'R', 'S', 'T', 'U'];
    var txtEcliptics = txtCircle(draw, 'txtEcliptic', centerX, centerY, txtEclipticText, fontStyle, radius, ascAngle);
    var txtEclipticRulers = txtCircle(draw, 'txtEclipticRuler', centerX, centerY, txtEclipticRulerArr, fontStyle2, radius, ascAngle + 6);
    var txtEclipticGroup = draw.group();
    for (var i = 0; i < txtEcliptics.length; i++) {
      txtEclipticGroup.add(txtEcliptics[i]).add(txtEclipticRulers[i]);
    }
    return txtEclipticGroup;
  };

  // House text circle
  var txtHouseCircle = function(draw, centerX, centerY, radius, ascAngle) {
    var txts = [];
    var txtHouseRulerArr = ['Q', 'P', 'O', 'N', 'M', 'O', 'P', 'V', 'R', 'S', 'T', 'U'];
    var txtRulers = [];
    for (var i = 0; i < houseArr.length; i++) {
      var nextItem = houseArr[i + 1];
      if (i + 1 === houseArr.length) {
        nextItem = houseArr[0];
      }
      var centerAngle = (nextItem - houseArr[i]) / 2;
      if (centerAngle < 0) {
        centerAngle += 180;
      }
      var angle = houseArr[i] + centerAngle;
      // console.log('angle:'+angle);
      txts.push([(i + 1) + '', angle]);
      txtRulers.push([txtHouseRulerArr[i], angle - 6]);
    }
    var fontStyle = {
      'size': 15,
      'font-family': 'astro',
      'color': 'blue'
    };
    var fontStyle2 = {
      'size': 15,
      'font-family': 'astro',
      'color': 'green'
    };
    var txtHouses = txtCircle(draw, 'txtHouse', centerX, centerY, txts, fontStyle, radius, ascAngle);
    var txtHouseRulers = txtCircle(draw, 'txtHouseRuler', centerX, centerY, txtRulers, fontStyle2, radius, ascAngle);
    var txtHouseGroup = draw.group();
    for (var j = 0; j < txtHouses.length; j++) {
      txtHouseGroup.add(txtHouses[j]).add(txtHouseRulers[j]);
    }
    return txtHouseGroup;
  };

  var planetDotMap = {};
  var drawDotPlanets = function(centerX, centerY) {
    var groupPlanets = draw.group();
    // planets dots circle
    var pDotArr = planetsCircle(draw, centerX, centerY, showPlanets, planetsData, centerX - 100, asc);
    // planets txts circle //draw, dotCircleName, centerX, centerY, txts, fontStyle, radius, ascAngle
    var fontStyle = {
      'size': 20,
      'font-family': 'astro',
      'color': 'red'
    };
    var txts1 = ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'f', 'g'];
    var txts = [];
    for (var i = 0; i < showPlanets.length; i++) {
      txts.push([txts1[i], planetsData[showPlanets[i]].lon]);
    }
    // txts.push(['f', asc]); //add ASC dot
    var pTxtArr = txtCircle(draw, 'txtPlanet', centerX, centerY, txts, fontStyle, centerX - 80, asc);
    // 按circle角度排序
    var sortFn = function(dataName, obj1, obj2) {
      var anglePT1 = obj1.data(dataName).lon;
      var anglePT2 = obj2.data(dataName).lon;
      return anglePT1 - anglePT2;
    };
    var sortFn1 = function(obj1, obj2) {
      return sortFn('txtPlanet', obj1, obj2);
    };
    var sortFn2 = function(obj1, obj2) {
      return sortFn('planet', obj1, obj2);
    };


    for (var m = 0; m < pDotArr.length; m++) {
      planetDotMap[showPlanets[m]] = pDotArr[m];
    }
    // planetDotMap['asc'] = pDotArr[pDotArr.length - 1];

    pTxtArr.sort(sortFn1);
    pDotArr.sort(sortFn2);
    // 动态调整文字角度,直到相互间的距离足够大,次数不超过50次
    for (var j = 0; j < 50; j++) {
      var adjuested = false;
      for (var i = 1; i < pTxtArr.length; i++) {
        var adjustRe = adjustCircleHitObj(pTxtArr[i], pTxtArr[i - 1], centerX, centerY);
        if (adjustRe) {
          adjuested = true;
          // console.log(pTxtArr[i].data('txtPlanet').lon);
        }
      }
      if (!adjuested) {
        console.log('adjustTimes:' + j);
        break;
      }
    }
    // 连接点与图
    var linkerArr = [];
    for (var i = 0; i < pDotArr.length; i++) {
      var bbox1 = pDotArr[i].bbox();
      var bbox2 = pTxtArr[i].bbox();
      var cx1 = bbox1.cx;
      var cy1 = bbox1.cy;
      var cx2 = bbox2.cx;
      var cy2 = bbox2.cy;
      linkerArr.push(draw.line(cx1, cy1, cx2, cy2).stroke('#ccc'));
    }
    for (var k = 0; k < pDotArr.length; k++) {
      groupPlanets.add(linkerArr[k]).add(pDotArr[k]).add(pTxtArr[k]);
    }
    return groupPlanets;
  };

  var aspectCreate = function(planetDotMap) {
    var aspectArr = aspectCount(planetsData);
    var aspectGroup = draw.group();
    var lineStyleArr = [
      strokeStyleOuter, strokeStyleInner, strokeStyleInner2
    ];
    for (var i = 0; i < aspectArr.length; i++) {
      var aptArr = aspectArr[i];
      var dot1 = planetDotMap[aptArr[1]];
      var dot2 = planetDotMap[aptArr[2]];
      var orb = aptArr[3];
      var lineSytle = lineStyleArr[0];
      if (orb > 1 && orb < 2) {
        lineSytle = lineStyleArr[1];
      } else if (orb >= 2) {
        lineSytle = lineStyleArr[2];
      }
      if (dot2 == undefined) {
        console.log('ERR! aptArr:' + aptArr[1] + ' ' + aptArr[2]);
        continue;
      }
      var aptLine = draw.line(dot1.cx(), dot1.cy(), dot2.cx(), dot2.cy()).stroke(lineSytle).back();
      aspectGroup.add(aptLine);
    }
    return aspectGroup;
  };


  var groupEcliptic = drawEcliptic().rotate(asc);
  var groupHouse = drawHouse().rotate(asc);
  var txtEcliptics = txtEclipticCircle(draw, centerX, centerY, centerX - 20, asc - 15);
  var txtHouseArr = txtHouseCircle(draw, centerX, centerY, centerX - 50, asc);
  var dotPlanets = drawDotPlanets(centerX, centerY);
  var aspectGroup = aspectCreate(planetDotMap);
  groupAll.add(groupEcliptic).add(groupHouse).add(txtEcliptics).add(txtHouseArr).add(aspectGroup).add(dotPlanets);


  // ASC and MC
  var lineAsc = draw.line(0 - padding * 2, 0, maxSize, 0).stroke(strokeStyleInner).center(centerX, centerY);
  var lineMc = draw.line(0 - padding * 2, 0, maxSize, 0).stroke(strokeStyleInner2).center(centerX, centerY);
  lineMc.rotate(0 - mc + asc);
  var ascFontStyle = {
    'size': 12,
    'color': 'blue'
  };
  var txtAsc = draw.text('Asc').font(ascFontStyle).fill(ascFontStyle.color).center(50, centerY);
  var txtMc = draw.text('Mc').font(ascFontStyle).fill(ascFontStyle.color);
  var txtMcPosi = pointRotate(centerX, centerY, 50, centerY, 0 - mc + asc);
  txtMc.center(txtMcPosi[0], txtMcPosi[1]);

  groupAll.add(lineAsc).add(lineMc).add(txtAsc).add(txtMc);
  groupAll.move(padding, padding);

}

var planetNames = [
  'sun',
  'moon',
  'mercury',
  'venus',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
  'pluto',
  'mean_node',
  'asc',
  'mc'
  // 'chiron',
  // 'pholus',
  // 'ceres',
  // 'pallas',
  // 'juno',
  // 'vesta',
  // 'cupido',
  // 'chariklo',
  // 'chaos',
  // 'eris',
  // 'nessus'
];

var checkOneLocation = function(lon, circleArr) {
  var len = circleArr.length;
  for (var i = 0; i < len; i++) {
    var a = circleArr[i];
    var b = circleArr[i + 1];
    if (lon < b && lon > a) {
      return i;
    }
  }
  if (circleArr[len - 1] > circleArr[0]) {
    return len - 1;
  }
  for (var j = 0; j < len; j++) {
    if (circleArr[j] > circleArr[j + 1]) {
      return j;
    }
  }
  //circleArr数据有误或lon超过arr范围，返回-1
  return -1;
};


var planetsLocations = function(asc, houses, planets) {
  var eclipticArr = [];
  for (var i = 0; i < 12; i++) {
    eclipticArr.push(i * 30);
  }
  var eclipticTxtArr = ['双鱼', '水瓶', '摩羯', '射手', '天蝎', '天秤', '处女', '狮子', '巨蟹', '双子', '金牛', '白羊'];
  for (var j in planets) {
    var lon = planets[j].lon;
    var rLon = (360 - lon < 0) ? 360 - lon + 360 : 360 - lon;
    // console.log('%s: rlon:%d', j, rLon);
    var eclipticPo = checkOneLocation(rLon, eclipticArr);
    planets[j].inEclipticTxt = eclipticTxtArr[eclipticPo];
    planets[j].inEcliptic = eclipticPo;
    planets[j].inHouses = checkOneLocation(lon, houses);
  }
  return planets;
};


// var data = { "re": 0, "t": 1489821866550, "data": { "houses": [317.4095710373527, 0.9763282091557582, 36.16228292777735, 62.77717143765739, 85.48021698457694, 108.55648558751489, 137.4095710373527, 180.97632820915575, 216.16228292777734, 242.7771714376574, 265.48021698457694, 288.5564855875149], "planets": { "sun": { "name": "sun", "lon": 289.94342709467026, "lat": 0.000998749690607235, "spd": 1.0344906567638645 }, "moon": { "name": "moon", "lon": 265.6386507152939, "lat": 2.883600625983786, "spd": 19.79296950139542 }, "mercury": { "name": "mercury", "lon": 284.8313312849967, "lat": -1.609385686203569, "spd": 1.6098382585028048 }, "venus": { "name": "venus", "lon": 271.08438134181074, "lat": 0.3168202500871548, "spd": 1.2616075014193484 }, "mars": { "name": "mars", "lon": 311.7952602027917, "lat": -1.1286196983859795, "spd": 0.7952487607099101 }, "jupiter": { "name": "jupiter", "lon": 67.03406896012608, "lat": -0.6728164080519424, "spd": -0.07076322518173583 }, "saturn": { "name": "saturn", "lon": 220.19045758323855, "lat": 2.369025473893533, "spd": 0.06601945841566703 }, "uranus": { "name": "uranus", "lon": 4.937306327392359, "lat": -0.6996854017985078, "spd": 0.0231501767000708 }, "neptune": { "name": "neptune", "lon": 331.32900754375686, "lat": -0.6087726290992674, "spd": 0.030494514646761672 }, "pluto": { "name": "pluto", "lon": 279.6409972038711, "lat": 3.314317863464566, "spd": 0.03572964089926245 }, "mean_node": { "name": "mean_node", "lon": 233.11906681960454, "lat": 0, "spd": -0.052907316216987965 }, "asc": { "name": "asc", "lon": 317.4095710373527 }, "mc": { "name": "mc", "lon": 242.7771714376574 } }, "asc": 317.4095710373527, "mc": 242.7771714376574 }, "s": "5435d00a296739678b6484bbd0bafc87", "costTime": 0 };
// var nData = planetsLocations(data.data.asc, data.data.houses, data.data.planets);
// console.log(nData);


$(function() {
  $('#f_labeForm').submit(function() {
    if (!SVG.supported) {
      alert('SVG 不支持!请使用较新的浏览器,推荐谷歌浏览器.');
      return false;
    }
    var userName = $('#userNameInput').val();
    var geoLon = $('#geoLonInput').val();
    var geoLat = $('#geoLatInput').val();
    var timeZone = $('#timeZoneInput').val();
    if (!checkStrLen(userName, 1, 18) || !checkStrLen(geoLon, 1, 18) || !checkStrLen(geoLat, 1, 18)) {
      alert('信息输入不完整');
      return false;
    }
    var data = formToJson('#f_labeForm', true);
    var reqData = makeApiReq('astrolabe', data, 'testKey');
    jsonReq('astrolabe/query', reqData, function(err, re) {
      if (err) {
        alert('查询失败,请检查输入!');
        return false;
      }
      if (re.re === 0) {
        $('#astrolabe').html('');
        var draw = SVG('astrolabe');
        astroShow(draw, planetNames, re.data.planets, re.data.houses, re.data.asc, re.data.mc);
        return false;
      } else {
        alert('生成星盘失败! - ' + re.re);
        return false;
      }
    });
    return false;
  });
});


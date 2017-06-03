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

function astroShow(draw, showPlanets, planetsData, houseArr, asc, mc, aspectArr, planetsDataB) {
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

  var drawHouse = function(planetsDataB) {
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
    if (planetsDataB) {
      var circle5 = circle3.clone().size(circleDiameter - 280).center(centerX, centerY);
      groupHouse.add(lineHouseGroup).add(circle3).add(circle4).add(circle5).add(circleCenter);
    } else {

      groupHouse.add(lineHouseGroup).add(circle3).add(circle4).add(circleCenter); //.add(lineStarGroup);
    }

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

  var drawDotPlanets = function(planetsData, centerX, centerY, shift, isOnlyDot) {
    var planetDotMap = {};
    var groupPlanets = draw.group();
    shift = shift || 0;
    // planets dots circle
    var pDotArr = planetsCircle(draw, centerX, centerY, showPlanets, planetsData, centerX - 100 + shift, asc);
    // planets txts circle //draw, dotCircleName, centerX, centerY, txts, fontStyle, radius, ascAngle
    for (var m = 0; m < pDotArr.length; m++) {
      planetDotMap[showPlanets[m]] = pDotArr[m];
    }

    if (isOnlyDot) {
      for (var k = 0; k < pDotArr.length; k++) {
        groupPlanets.add(pDotArr[k]);
      }
      return [groupPlanets, planetDotMap];
    }
    var fontStyle = {
      'size': 20,
      'font-family': 'astro',
      'color': 'red'
    };
    var txts1 = ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'f', 'g'];
    var txts = [];
    for (var n = 0; n < showPlanets.length; n++) {
      txts.push([txts1[n], planetsData[showPlanets[n]].lon]);
    }
    // txts.push(['f', asc]); //add ASC dot
    var pTxtArr = txtCircle(draw, 'txtPlanet', centerX, centerY, txts, fontStyle, centerX - 80 + shift, asc);
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
    for (var l = 0; l < pDotArr.length; l++) {
      var bbox1 = pDotArr[l].bbox();
      var bbox2 = pTxtArr[l].bbox();
      var cx1 = bbox1.cx;
      var cy1 = bbox1.cy;
      var cx2 = bbox2.cx;
      var cy2 = bbox2.cy;
      linkerArr.push(draw.line(cx1, cy1, cx2, cy2).stroke('#ccc'));
    }
    for (var k = 0; k < pDotArr.length; k++) {
      groupPlanets.add(linkerArr[k]).add(pDotArr[k]).add(pTxtArr[k]);
    }
    return [groupPlanets, planetDotMap];
  };

  var aspectCreate = function(planetDotMap, planetDotMapB) {
    // var aspectArr = aspectCount(planetsData);
    var aspectGroup = draw.group();
    var lineStyleArr = [
      strokeStyleOuter, strokeStyleInner, strokeStyleInner2
    ];
    for (var i = 0; i < aspectArr.length; i++) {
      var aptArr = aspectArr[i];
      var dot1 = planetDotMap[aptArr[1]];
      var dot2 = (planetDotMapB) ? planetDotMapB[aptArr[2]] : planetDotMap[aptArr[2]];
      var orb = aptArr[4];
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
  var groupHouse = drawHouse(planetsDataB).rotate(asc);
  var txtEcliptics = txtEclipticCircle(draw, centerX, centerY, centerX - 20, asc - 15);
  var txtHouseArr = txtHouseCircle(draw, centerX, centerY, centerX - 50, asc);
  // var aspectGroup = aspectCreate(planetDotMap);
  // groupAll.add(groupEcliptic).add(groupHouse).add(txtEcliptics).add(txtHouseArr).add(dotPlanets);
  groupAll.add(groupEcliptic).add(groupHouse).add(txtEcliptics).add(txtHouseArr);
  var aspectGroup;
  var dotPlanetsArr;
  if (planetsDataB) {
    dotPlanetsArr = drawDotPlanets(planetsData, centerX, centerY, -40);
    var dotPlanetsBArr = drawDotPlanets(planetsDataB, centerX, centerY);
    var dotPlanetsBCopy = drawDotPlanets(planetsDataB, centerX, centerY, -40, true);
    groupAll.add(dotPlanetsBArr[0]).add(dotPlanetsBCopy[0]);

    aspectGroup = aspectCreate(dotPlanetsArr[1], dotPlanetsBCopy[1]);
  } else {
    dotPlanetsArr = drawDotPlanets(planetsData, centerX, centerY);
    aspectGroup = aspectCreate(dotPlanetsArr[1]);
  }
  groupAll.add(aspectGroup).add(dotPlanetsArr[0]);


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



var drawAstroTxt = function(draw) {
  var eclipticTxtArr = ['双鱼', '水瓶', '摩羯', '射手', '天蝎', '天秤', '处女', '狮子', '巨蟹', '双子', '金牛', '白羊'].reverse();
  var txtEclipticText = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  var planetNames = [
    ['sun', '太阳', 'M'],
    ['moon', '月亮', 'N'],
    ['mercury', '水星', 'O'],
    ['venus', '金星', 'P'],
    ['mars', '火星', 'Q'],
    ['jupiter', '木星', 'R'],
    ['saturn', '土星', 'S'],
    ['uranus', '天王星', 'T'],
    ['neptune', '海王星', 'U'],
    ['pluto', '冥王星', 'V']
  ];
  draw.clear();
  var maxSize = 500;
  var padding = 40;
  var fontStyle = {
    'size': 20,
    'font-family': 'astro',
    'color': 'red'
  };
  draw.size('100%', '100%').viewbox(0, 0, maxSize, maxSize / 3);
  for (var i = 0; i < eclipticTxtArr.length; i++) {
    draw.text(eclipticTxtArr[i]).cx(i * padding + 15).y(10);
    draw.text(txtEclipticText[i]).font(fontStyle).fill(fontStyle.color).cx(i * padding + 15).y(30);
  }
  var yPo = 80;
  for (var j = 0; j < planetNames.length; j++) {
    var one = planetNames[j];
    draw.text(one[0]).cx(j * (padding + 9) + 15).y(yPo);
    draw.text(one[1]).cx(j * (padding + 9) + 15).y(yPo + 20);
    draw.text(one[2]).font(fontStyle).fill(fontStyle.color).cx(j * (padding + 9) + 15).y(yPo + 40);
  }
};


var checkNum = function(strInput, len, isInt, isPositive) {
  if (!strInput) {
    return false;
  }
  var isPositiveRe = (isPositive) ? '' : '[\\-]?';
  var isIntRe = (isInt) ? '' : '[\\.]?[\\d]+';
  var regStr = '^' + isPositiveRe + '[\\d]{' + len + ',}' + isIntRe + '$';
  // console.log('regStr:%j', regStr);
  return strInput.match(new RegExp(regStr, 'g'));
};



var checkFormJson = function(jsonData) {
  var targetStrArr = ['userName'];
  var targetIntArr = ['birthYear', 'birtMonth', 'birthDate', 'birthHours', 'birthMinutes', 'birthSeconds', 'timeZone'];
  var targetFloatArr = ['geoLon', 'geoLat'];
  if (!jsonData.isCompare) {
    console.log('e1');
    return false;
  }
  if (jsonData.isCompare === 'true') {
    var addArr = [];
    for (var i = 0; i < targetIntArr.length; i++) {
      addArr.push(targetIntArr[i] + 'B');
    }
    targetIntArr = targetIntArr.concat(addArr);
    targetFloatArr = targetFloatArr.concat(['geoLonB', 'geoLatB']);
    targetStrArr.push('userNameB');
  } else {
    jsonData.isCompare = 'false';
  }


  for (var j = 0; j < targetStrArr.length; j++) {
    if (!jsonData[targetStrArr[j]] || jsonData[targetStrArr[j]].length < 1) {
      console.log('e2' + j, targetStrArr[j]);
      return false;
    }
  }

  for (var k = 0; k < targetIntArr.length; k++) {
    if (!jsonData[targetIntArr[k]] || !checkNum(jsonData[targetIntArr[k]], 1, true, true)) {
      console.log('e3' + k, targetIntArr[k]);
      return false;
    }
  }

  for (var l = 0; l < targetFloatArr.length; l++) {
    if (!jsonData[targetFloatArr[l]] || !checkNum(jsonData[targetFloatArr[l]], 1, false, false)) {
      console.log('e4' + l, targetFloatArr[l]);
      return false;
    }
  }
  return true;
};


$(function() {

  $('#profileB').hide();

  var drawTxt = SVG('astroTxt');

  drawAstroTxt(drawTxt);



  $('#f_labeForm').submit(function() {
    if (!SVG.supported) {
      alert('SVG 不支持!请使用较新的浏览器,推荐谷歌浏览器.');
      return false;
    }

    var data = formToJson('#f_labeForm', true);
    if (!checkFormJson(data)) {
      alert('参数错误!');
      return false;
    }

    var reqData = makeApiReq('astrolabe', data, 'testKey');
    jsonReq('astrolabe/query', reqData, function(err, re) {
      if (err) {
        alert('查询失败,请检查输入!');
        return false;
      }
      if (re.re === 0) {
        $('#astrolabe').html('');
        var draw = SVG('astrolabe');
        if (re.data.aspects) {
          astroShow(draw, planetNames, re.data.planets, re.data.houses, re.data.asc, re.data.mc, re.data.aspects);
        } else {
          astroShow(draw, planetNames, re.data.planets, re.data.houses, re.data.asc, re.data.mc, re.data.aspectsInA, re.data.astroDataB.planets);
        }
        // var nData = planetsLocations(re.data.asc, re.data.houses, re.data.planets);
        // console.log(nData);
        return false;
      } else {
        alert('生成星盘失败! - ' + re.re);
        return false;
      }
    });
    return false;
  });


  var profileState = false;
  $('#addProfile').click(function() {
    var text = null;
    if (profileState) {
      profileState = false;
      text = '打开对比盘';
    } else {
      profileState = true;
      text = '关闭对比盘';
    }
    $('#profileB').toggle(100, function() {
      $('#isCompare').val(profileState);
      $('#addProfile').text(text);
    });
  });

});

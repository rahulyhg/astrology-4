/*
aspect table curd
 */
'use strict';
var kc = require('kc');
var ktool = require('ktool');
var db = kc.mongo;
var redis = kc.redis;
var vlog = require('vlog').instance(__filename);
var curd = require('./_tableCurd');

var kconfig = ktool.kconfig;
//标准API协议所用到的key,可根据情况从配置文件,数据库或其他位置获取,这里仅作为示例
var apiKey = kconfig.getConfig().apiKey;


var prop = {
  'tb': 'aspect',
  'tbName': '相位',
  'apiKey': apiKey,
  'defaultSearch': 'planetA',
  'listFields': {
    planetA: 1,
    planetB: 1,
    planetAEn: 1,
    planetBEn: 1,
    angle: 1,
    aspectTxt1: 1,
    createTime: 1
  },

  'fieldsType': {
    'planetA': 'string',
    'planetB': 'string',
    'planetAEn': 'string',
    'planetBEn': 'string',
    'angle': 'int',
    'aspectTxt1': 'string',
    'createTime': 'int'
  },
  // ,render: function ( data, type, full, meta ) {switch (data){case 0: return \'待审核\'; case 1: return \'待修改\'; case 10: return \'通过\'; case 2: return \'已下线\'; } }
  'addObjFn': function(req, reqData, callback) {
    var dbObj = {
      planetA: reqData.planetA.trim(),
      planetB: reqData.planetB.trim(),
      planetAEn: reqData.planetAEn.trim(),
      planetBEn: reqData.planetBEn.trim(),
      angle: reqData.angle || 0,
      aspectTxt1: req.aspectTxt1,
      createTime: (new Date()).getTime(),
      state: 0
    };
    callback(null, dbObj);
  },

  'validatorAdd': {
    'planetA': ['strLen', [1, 10]],
    'planetB': ['strLen', [1, 10]],
    'planetAEn': ['strLen', [2, 30]],
    'planetBEn': ['strLen', [2, 30]],
    'angle': 'strInt',
    'aspectTxt1': 'string'
  },

  'validatorUpdate': {
    '@planetA': ['strLen', [1, 10]],
    '@planetB': ['strLen', [1, 10]],
    '@planetAEn': ['strLen', [2, 30]],
    '@planetBEn': ['strLen', [2, 30]],
    '@angle': 'strInt',
    '@aspectTxt1': 'string'
  },

  'validatorDel': {
    'c_id': ['strLen', [24, 30]]
  },

  // 'creatorFilter': 'cpid', //用于判断当前登录用户是否是自己,此值为当前表中包含的对应用户ID的字段
  'cLevel': 0,
  'rLevel': 0,
  'uLevel': 5, //硬删除权限
  'dLevel': 5,
  'mLevel': 5
};
var ci = curd.instance(prop);

exports.router = function() {
  return ci.router;
};

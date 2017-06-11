/*
对数据表进行curd可视化操作
 */
'use strict';
var kc = require('kc');
var ktool = require('ktool');
var iApi = kc.iApi;
var db = kc.mongo;
var render = kc.render();
var error = require('./../error');
var vlog = require('vlog').instance(__filename);



var defaultFindUser = function(userId, callback) {
  db.findFromDb('user', '_id', db.idObj(userId), function(err, doc) {
    if (err) {
      vlog.eo(err, 'find user');
      return;
    }
    callback(null, doc);
  });
};

var Curd = {
  instance: function(prop) {
    var me = {};
    me.tb = prop.tb;
    me.tbName = prop.tbName;
    me.apiKey = prop.apiKey;
    me.defaultSearch = prop.defaultSearch || 'name';
    me.listFields = prop.listFields;
    me.fieldsType = prop.fieldsType;
    me.listQueryAsync = prop.listQueryAsync;
    me.listQuery = prop.listQuery;
    // me.curdAddObj = prop.curdAddObj;
    me.validatorAdd = prop.validatorAdd;
    me.validatorUpdate = prop.validatorUpdate;
    me.validatorDel = prop.validatorDel;
    me.addObjFn = prop.addObjFn;
    me.findUser = prop.findUser || defaultFindUser;
    // me.listColumns = prop.listColumns;
    // me.oneJst = prop.oneJst;
    // me.updateJst = prop.updateJst;
    // me.updateReviewJst = prop.updateReviewJst;
    var jst = {};
    jst.tb = prop.tb;
    jst.tbName = prop.tbName;
    // jst.listColumns = prop.listColumns;
    // jst.listTh = prop.listTh;
    // jst.addForm = prop.addForm;
    // if (me.oneJst) {
    //   jst.haveOne = true;
    // }
    me.jst = jst;
    me.dLevel = prop.dLevel;
    me.rLevel = prop.rLevel;
    me.uLevel = prop.uLevel;
    me.cLevel = prop.cLevel;
    me.mLevel = prop.mLevel;
    me.creatorFilter = prop.creatorFilter;

    me.events = {};
    me.on = function(event, fn) {
      me.events[event] = fn;
    };

    me.setUpdate = function(checkObj, reqObj) {
      var out = {};
      var isEmpty = true;
      for (var i in checkObj) {
        if (reqObj[i] && reqObj[i] !== '') {
          isEmpty = false;
          if (checkObj[i] === 'int') {
            out[i] = parseInt(reqObj[i]);
          } else {
            out[i] = reqObj[i];
          }
        }
      }
      if (isEmpty) {
        return null;
      }
      return { '$set': out };
    };

    var reDataTables = function(draw, recordsFiltered, recordsTotal, data) {
      var re = {
        'draw': draw,
        'recordsTotal': recordsTotal,
        'recordsFiltered': recordsFiltered,
        'data': data
      };
      return re;
    };



    var showId = function(req, resp, renderName) {
      if (parseInt(req.userLevel) < me.rLevel && req.params.id !== req.userId) {
        resp.status(200).send(error.json('level'));
        return;
      }
      db.findFromDb(me.tb, '_id', db.idObj(req.params.id), function(err, re) {
        if (err) {
          vlog.error(err);
          resp.status(200).send(error.json('tableCurd_showId'));
          return;
        }
        if (re) {
          // vlog.log('showId re:%j',re);
          me.findUser(req.userId, function(err, userObj) {
            if (err) {
              vlog.eo(err, 'find userName');
              return;
            }
            resp.send(render[renderName]({
              'jst': jst,
              'curd': re,
              'rootPath': '..',
              'user': userObj
            }));
          });
        } else {
          resp.status(404).send(error.err['404']);
        }
      });
    };


    me.list = function(req, resp, query, callback) {
      var search = ktool.dotSelector(req.body, 'search.value');
      if (search && search !== '') {
        var po = search.indexOf(':');
        if (po < 0) {
          query[me.defaultSearch] = {
            '$regex': search.trim()
          };
        } else {
          var key = search.substring(0, po).trim();
          // vlog.log('search key:%s',key);
          var keyType = me.fieldsType[key];
          if (keyType) {

            var val = search.substring(po + 1).trim();
            // vlog.log('search value:%s',val);
            if (keyType === 'int') {
              query[key] = parseInt(val);
            } else {
              query[key] = {
                '$regex': val
              };
            }
          }
        }
      }
      // vlog.log('req.body:%j',req.body);
      var draw = parseInt(req.body.draw);
      if (isNaN(draw)) {
        // resp.status(200).send('');
        return callback(null, '');
      }
      var start = parseInt(req.body.start);
      var length = parseInt(req.body.length);



      db.checkColl(me.tb, function(err, coll) {
        if (err) {
          return callback(vlog.ee(err, 'count checkColl'), 'listError1', 500, 'db');
        }
        coll.count(query, {}, function(err, dbCount) {
          if (err) {
            return callback(vlog.ee(err, 'count'), 'listError2');
          }

          db.queryFromDb(me.tb, query, {
            'fields': me.listFields,
            'skip': start,
            'limit': length,
            'sort': {
              '_id': -1
            }
          }, function(err, docs) {
            if (err) {
              // vlog.error(err.stack);
              // resp.status(500).send(reDataTables(draw, 0, 0, null, 'list error 2'));
              return callback(vlog.ee(err, 'list:queryFromDb', query), 'listError3');
            }
            // vlog.log('docs:%j',docs);
            callback(null, reDataTables(draw, dbCount, docs.length, docs));
          });

        });

      });


    };

    var list = function(req, resp, callback) {
      var query = {};
      //除管理员身份和渠道列表以外，均只能匹配对应userId的内容
      if (req.userLevel < me.rLevel && me.creatorFilter) {
        query[me.creatorFilter] = req.userId;
      }

      if (Object.prototype.toString.call(me.listQueryAsync) === '[object Function]') {
        me.listQueryAsync(req, function(err, queryRe) {
          if (err) {
            return callback(vlog.ee(err, 'listQueryAsync'), 'listError3');
          }
          query = queryRe;
          // console.log('query:%j',query);
          me.list(req, resp, query, callback);
        });
        return;
      }
      if (Object.prototype.toString.call(me.listQuery) === '[object Function]') {
        query = me.listQuery(req);
      }
      me.list(req, resp, query, callback);
    };


    var update = function(req, resp, callback) {
      var reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
      if (reqDataArr[0] !== 0) {
        return callback(vlog.ee(new Error('iApi req'), 'update', reqDataArr), 'updateErr1', 200, reqDataArr[0]);
      }
      var reqData = reqDataArr[1];
      // vlog.log('update reqData:%j', reqData);
      var query = {
        _id: db.idObj(reqData.c_id)
      };
      var update = me.setUpdate(me.fieldsType, reqData);
      if (!update) {
        return callback(null, error.json('params'));
      }
      // vlog.log('curd update: %j,query:%j',update,query);
      db.update(me.tb, query, update, { 'upsert': false, 'multi': false }, function(err) {
        if (err) {
          return callback(vlog.ee(err, 'curdUpdate'), 'updateErr2', 200, 'tableCurd_curdUpdate');
        }
        var respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
        //返回
        callback(null, respObj);
        if (me.events['updateOK']) {
          me.events['updateOK'](req.body, req.userId, req.userLevel);
        }
      });
    };

    var del = function(req, resp, callback) {
      var reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
      if (reqDataArr[0] !== 0) {
        return callback(vlog.ee(new Error('iApi req'), 'del', reqDataArr), null, 200, reqDataArr[0]);
      }
      var reqData = reqDataArr[1];
      // vlog.log('del reqData:%j',reqData);
      var query = {
        _id: db.idObj(reqData.c_id)
      };
      // vlog.log('curd del: %j',query);
      db.del(me.tb, query, null, function(err, re) {
        if (err) {
          return callback(vlog.ee(err, 'curdDel'), 'del', 200, 'tableCurd_hardDel');
        }
        var respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
        callback(null, respObj);
        if (me.events['hardDelOK']) {
          me.events['hardDelOK'](req.body, req.userId, req.userLevel);
        }
      });
    };

    var add = function(req, resp, callback) {
      var reqDataArr = iApi.parseApiReq(req.body, me.apiKey);
      if (reqDataArr[0] !== 0) {
        return callback(vlog.ee(new Error('iApi req'), 'dbEdit:add', reqDataArr), 'add', 200, reqDataArr[0]);
      }
      var reqData = reqDataArr[1];
      // vlog.log('curd add req body:%j',req.body);

      me.addObjFn(req, reqData, function(err, dbObj) {
        if (err) {
          return callback(vlog.ee(err, 'addObjFn'));
        }
        if (!dbObj._id) {
          var objId = db.newObjectId();
          dbObj['_id'] = objId;
        }
        // vlog.log('dbObj:%j',dbObj);
        db.addToDb(me.tb, dbObj, function(err, re) {
          if (err) {
            return callback(vlog.ee(err, 'curdAdd'), null, 200, 'curdAdd');
          }
          // vlog.log('curd add re:%s',re);
          var respObj = iApi.makeApiResp(0, 'ok', me.apiKey);
          callback(null, respObj);
          if (me.events['addOK']) {
            me.events['addOK'](req.body, req.userId, req.userLevel, dbObj);
          }
        });
      });
    };

    var iiConfig = {
      'auth': true, //[auth]:是否需要登录验证,默认需要auth,除非配置强制设置为false
      // 'validatorFailStateCode':403, //[validatorFailStateCode]:当validator验证失败时返回的http状态码,默认为200,此处可以进行全局修改
      // 'type': 'application/urlencoded', //[type]:http请求头的type,可选,默认'application/json'
      'act': {
        //接口1,地址如:http://localhost:16000/product/testAct
        'list': {
          'showLevel': me.rLevel,
          'resp': list
        },
        'add': {
          'showLevel': me.cLevel,
          'validator': me.validatorAdd,
          'resp': add
        },
        'update': {
          'showLevel': me.uLevel,
          'validator': me.validatorUpdate,
          'resp': update
        },
        'del': {
          'showLevel': me.dLevel,
          'validator': me.validatorDel,
          'resp': del
        }
      }
    };

    //由以上配置生成router
    var router = iApi.getRouter(iiConfig);

    //声明get方式的响应,可以在此使用tpls中的模板

    router.get('/show/:id', function(req, resp, next) {
      showId(req, resp, me.tb + 'One');
    });

    router.get('/update/:id', function(req, resp, next) {
      showId(req, resp, me.tb + 'Update');
    });


    router.get('/', function(req, resp, next) {
      me.findUser(req.userId, function(err, doc) {
        if (err) {
          vlog.eo(err, 'find userName');
          return;
        }
        resp.send(render[me.tb]({
          'jst': me.jst,
          'level': req.userLevel,
          'userId': req.userId,
          'user': doc
        }));
      });
    });



    me.router = router;
    router.get('*', function(req, resp, next) {
      resp.status(404).send(error.json('404', me.tb));
    });
    return me;
  }
};
exports.instance = Curd.instance;

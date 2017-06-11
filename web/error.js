/*
通用的错误码,根据情况不断追加
 */
'use strict';
var kc = require('kc');
var error = kc.error;
var err = error.err;


err['testErr'] = '404004';
err['tableCurd_showId'] = '500101';
err['tableCurd_curdUpdate'] = '500102';
err['tableCurd_hardDel'] = '500103';

exports.err = err;
exports.json = error.json;


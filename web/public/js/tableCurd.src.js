'use strict';

var appCode = 'astro';
var channel = '13000';
var ver = 1;

var smallAlertShow = function(title, context) {
  if (title) {
    $('#smallAlertTitle').html(title);
  }
  if (context) {
    $('#smallAlertContext').html(context);
  }
  $('#smallAlert').modal('show');
};

$('#curdAddFrom').submit(function() {
  var bt = $('#curdAddSubmit');
  bt.button('loading');
  // var data = JSON.stringify($('#loginForm').serializeArray());
  var data = formToJson('#curdAddFrom', true);
  var rootPath = $('#rootPath').val();
  // console.log('data:'+data +' tb:'+tb);
  jsonReq(rootPath + '/add', makeApiReq('add', data, appCode, channel, ver), 'application/json', function(err, re) {
    // console.log('re:'+re);
    if (err) {
      bt.button('reset');
      alert('信息添加失败，请检查输入.');
      return false;
    }
    if (re && re.re === 0) {
      bt.hide();
      var _form = $('#curdAddBody').html();
      $('#curdAddBody').html('添加成功!');
      $('#curdAdd').on('hidden.bs.modal', function() {
        $('#curdAddBody').html(_form);
        bt.show().button('reset');
        $('#curdTable').DataTable().ajax.reload();
      });
      return false;
    }
    bt.button('reset');
    alert('信息添加失败，请检查输入.'); //只能用alert,因为modal已经开启了
    return false;
  });
  return false;
});

$('#curdUpdateForm').submit(function(err) {
  var bt = $('#curdUpdateSubmit');
  bt.button('loading');
  // var data = JSON.stringify($('#loginForm').serializeArray());
  // console.log('#tbls:',$('#tbls').val());
  var tbls = ($('#tbls')) ? $('#tbls').val() : null;
  var data = formToJson('#curdUpdateForm', true);
  var rootPath = $('#rootPath').val();
  var postPre = (tbls) ? rootPath + '/' + tbls : rootPath + '/update';
  // console.log('postPre:',postPre);
  jsonReq(postPre, makeApiReq('update', data, appCode, channel, ver), 'application/json', function(err, re) {
    if (err) {
      bt.button('reset');
      smallAlertShow('修改失败', '信息修改失败，请检查输入.');
      return false;
    }
    if (re && re.re === 0) {
      bt.button('reset');
      $('#smallAlert').modal('show');
      $('#smallAlert').on('hidden.bs.modal', function(err) {
        var c_id = $('#c_id').val();
        window.location = rootPath + '/show/' + c_id;
      });
      return false;
    }
    bt.button('reset');
    smallAlertShow('修改失败', '信息修改失败，请检查输入.');
    return false;
  });
  return false;

});
$('#curdDel').click(function() {
  var c_id = $('#c_id').val();
  if (!c_id || c_id.trim().length <= 0) {
    smallAlertShow('删除失败', '信息删除失败，请检查输入.');
    return false;
  }
  var bt = $('#curdDel');
  bt.button('loading');
  var rootPath = $('#rootPath').val();
  if (confirm('确认彻底删除？ 删除后将无法恢复，建议将state改为-1即可达到删除效果。')) {
    var data = { 'c_id': $('#c_id').val() };
    // console.log('data:'+data+' tb:'+tb);
    jsonReq(rootPath + '/del', makeApiReq('del', data, appCode, channel, ver), 'application/json', function(err, re) {
      if (err) {
        bt.button('reset');
        smallAlertShow('删除失败', '信息删除失败.');
        return false;
      }
      if (re && re.re === 0) {
        bt.button('reset');
        smallAlertShow('删除成功', '信息删除成功，数据已不在库中.');
        return false;
      }
      bt.button('reset');
      smallAlertShow('删除失败', '删除失败.数据库未实际处理。');
      return false;
    });
    return false;
  }else{
    bt.button('reset');
  }
});


var changeState = function(tbls, btId, otherData) {
  var c_id = $('#c_id').val();
  if (!c_id || c_id.trim().length <= 0) {
    smallAlertShow('操作失败', '操作失败，请检查输入.');
    return false;
  }
  var bt = $(btId);
  bt.button('loading');
  var data = otherData || { 'c_id': $('#c_id').val() };
  // console.log('data:' + data + ' tbls:' + tbls);
  jsonReq(tbls, makeApiReq('changeState', data, appCode, channel, ver), 'application/json', function(err, re) {
    if (err) {
      bt.button('reset');
      smallAlertShow('操作失败', '操作失败，请联系平台管理员。');
      return false;
    }
    if (re && re.re === 0) {
      bt.button('reset');
      $('#smallAlert').on('hidden.bs.modal', function(err) {
        window.location.reload();
      });
      smallAlertShow('操作成功', '操作成功，数据状态已变化.');
      return false;
    }
    bt.button('reset');
    smallAlertShow('操作失败', '操作失败.未实际生效，请联系平台管理员。');
    return false;
  });
};
$('#curdPassNew').click(function() {
  var rootPath = $('#rootPath').val();
  var tbls = rootPath + $('#tbls').val() + '/passNew';
  var btId = '#curdPassNew';
  changeState(tbls, btId);
});

$('#curdDenyNew').click(function() {
  var rootPath = $('#rootPath').val();
  var tbls = rootPath + $('#tbls').val() + '/denyNew';
  var btId = '#curdDenyNew';
  changeState(tbls, btId);
});
$('#downLine').click(function() {
  var rootPath = $('#rootPath').val();
  var tbls = rootPath + $('#tbls').val() + '/downLine';
  var btId = '#downLine';
  changeState(tbls, btId);
});
$('#upLine').click(function() {
  var rootPath = $('#rootPath').val();
  var tbls = rootPath + $('#tbls').val() + '/upLine';
  var btId = '#upLine';
  changeState(tbls, btId);
});
$('#del').click(function() {
  var rootPath = $('#rootPath').val();
  var tbls = rootPath + $('#tbls').val() + '/del';
  var btId = '#del';
  changeState(tbls, btId);
});

$('#passUpdate').click(function() {
  var tbls = $('#tbls').val() + '/passUpdate';
  var btId = '#passUpdate';
  var data = formToJson('#reviewUpdateForm', true);
  changeState(tbls, btId, data);
});

$('#denyUpdate').click(function() {
  var tbls = $('#tbls').val() + '/denyUpdate';
  var btId = '#denyUpdate';
  changeState(tbls, btId, {'reviewId': $('#reviewId').val(),'c_id':$('#c_id').val()});
});

'use strict';


var listLoc = function(ajaxData, idPara, textPara) {
  if (ajaxData.re !== 0 || ajaxData.data.length <= 0) {
    return { results: [] };
  }
  var outArr = [];
  for (var i = 0; i < ajaxData.data.length; i++) {
    var id = idPara ? ajaxData.data[i][idPara] : ajaxData.data[i];
    var text = textPara ? ajaxData.data[i][textPara] : ajaxData.data[i];
    outArr.push({ 'id': id, 'text': text });
  }
  return { results: outArr };
};

var locatGEO = function(countryInput, cityInput, geoLonInput, geoLatInput) {

  $(countryInput).select2({
    minimumInputLength: 2,
    placeholder: '输入国家英文名称快速检索',
    ajax: {
      url: 'location/country',
      dataType: 'json',
      delay: 500,
      data: function(params) {
        return {
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function(data, params) {
        return listLoc(data);
      },
      cache: true
    }
  });

  $(cityInput).select2({
    minimumInputLength: 2,
    placeholder: '输入城市拼音首字母(中国)或英文名快速检索',
    ajax: {
      url: function() {
        return 'location/city?c=' + $(countryInput).val();
      },
      dataType: 'json',
      delay: 500,
      data: function(params) {
        return {
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function(data, params) {
        return listLoc(data, 'geo', 'showTxt');
      },
      cache: true
    }
  });

  $(cityInput).on('select2:select', function(evt) {
    var geoArr = $(cityInput).val().split(',');
    // console.log(evt);
    if (geoArr.length === 2) {
      $(geoLonInput).val(geoArr[0]);
      $(geoLatInput).val(geoArr[1]);
    }
  });
};

locatGEO('#countryInput', '#cityInput', '#geoLonInput', '#geoLatInput');
locatGEO('#countryInputB', '#cityInputB', '#geoLonInputB', '#geoLatInputB');

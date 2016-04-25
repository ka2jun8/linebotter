var request = require('request');

//hotpepper apiつーかう
function hotpepper(place, keyword, json, callback) {

    // Hotpepper レストラン検索API
    var url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';

    console.log('hpepper = ' + process.env.HP_KEY);

    // ぐるなび リクエストパラメータの設定
    var query = {
        'key': process.env.HP_KEY,
        'format': 'json',
        'large_area':'Z011'
    };
    var options = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    // 検索結果をオブジェクト化
    var result = {};

    //console.log('proxy='+process.env.PROXY);
    
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if ('error' in body) {
                console.log('検索エラー' + JSON.stringify(body));
                return;
            }
        }
        
        var res = response.body;
        var shops = res.results.shop;
        
        result = {
            name: shops[0].name,
            shop_image1: shops[0].photo.mobile.l,
            address: shops[0].address,
            latitude: shops[0].lat,
            longitude: shops[0].lng,
            opentime: shops[0].open
        } ;       

        callback(null, result);
        
    });

}

module.exports = hotpepper;

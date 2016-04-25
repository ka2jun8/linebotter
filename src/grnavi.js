var request = require('request');

function grnavi(place, keyword, json, to_array, callback) {
    // ぐるなびAPI レストラン検索API
    var gnavi_url = 'http://api.gnavi.co.jp/RestSearchAPI/20150630/';

    console.log('gnavi = ' + process.env.GNAVI_KEY);

    // ぐるなび リクエストパラメータの設定
    var gnavi_query = {
        'keyid': process.env.GNAVI_KEY,
        'format': 'json',
        'address': place,
        'hit_per_page': 1,
        'freeword': keyword,
        'freeword_condition': 2
    };
    var gnavi_options = {
        url: gnavi_url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: gnavi_query,
        json: true
    };

    // 検索結果をオブジェクト化
    var search_result = {};

    //console.log('proxy='+process.env.PROXY);
    
    request.get(gnavi_options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if ('error' in body) {
                console.log('検索エラー' + JSON.stringify(body));
                return;
            }

            // 店名
            if ('name' in body.rest) {
                search_result['name'] = body.rest.name;
            }
            // 画像
            if ('image_url' in body.rest) {
                search_result['shop_image1'] = body.rest.image_url.shop_image1;
            }
            // 住所
            if ('address' in body.rest) {
                search_result['address'] = body.rest.address;
            }
            // 緯度
            if ('latitude' in body.rest) {
                search_result['latitude'] = body.rest.latitude;
            }
            // 軽度
            if ('longitude' in body.rest) {
                search_result['longitude'] = body.rest.longitude;
            }
            // 営業時間
            if ('opentime' in body.rest) {
                search_result['opentime'] = body.rest.opentime;
            }

            console.log('kani::: ' + JSON.stringify(search_result));

            let message = [
                // テキスト
                {
                    'contentType': 1,
                    'text': 'こちらはいかがですか？\n【お店】' + search_result['name'] + '\n【営業時間】' + search_result['opentime']
                },
                // 画像
                {
                    'contentType': 2,
                    'originalContentUrl': search_result['shop_image1'],
                    'previewImageUrl': search_result['shop_image1']
                },
                // 位置情報
                {
                    'contentType':7,
                    'text': search_result['name'],
                    'location':{
                        'title': search_result['address'],
                        'latitude': Number(search_result['latitude']),
                        'longitude': Number(search_result['longitude'])
                    }
                }
            ];

            callback(null, to_array, message);

        } else {
            console.log('error: ' + response.statusCode);
        }
    });

}

module.exports = grnavi;
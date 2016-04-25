const request = require('request');
const logger = require('./logger');

//hotpepper apiつーかう
function hotpepper(place, keyword, json, to_array, callback) {

    // Hotpepper レストラン検索API
    const url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
    logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

    // ぐるなび リクエストパラメータの設定
    const query = {
        'key': process.env.HP_KEY,
        'format': 'json',
        'keyword': place+' '+keyword
    };
    const options = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    // 検索結果をオブジェクト化
    let result = {};

    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if ('error' in body) {
                let errms = [{
                    'contentType': 1,
                    'text': '見つからなかったよー'
                }];
                callback(null, to_array, errms);
                console.log('検索エラー' + JSON.stringify(body));
                return;
            }
        }
        
        const res = response.body;
        const shops = res.results.shop;
        
        result = {
            name: shops[0].name,
            shop_image1: shops[0].photo.mobile.l,
            address: shops[0].address,
            latitude: shops[0].lat,
            longitude: shops[0].lng,
            opentime: shops[0].open
        } ;       

        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'こちらはいかがですか？\n【お店】' + result['name'] + '\n【営業時間】' + result['opentime']
            },
            // 画像
            {
                'contentType': 2,
                'originalContentUrl': result['shop_image1'],
                'previewImageUrl': result['shop_image1']
            },
            // 位置情報
            {
                'contentType':7,
                'text': result['name'],
                'location':{
                    'title': result['address'],
                    'latitude': Number(result['latitude']),
                    'longitude': Number(result['longitude'])
                }
            }
        ];
        callback(null, to_array, message);
        
    });

}

module.exports = hotpepper;

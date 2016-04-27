const request = require('request');
const logger = require('./logger');
const util = require('./util');

//hotpepper apiつーかう
function hotpepper(option, to_array, callback) {

    // Hotpepper レストラン検索API
    const url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
    //logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

    const keys = option.gkey;
    let keyword = '';
    const location = option.location;

    // HotPepper リクエストパラメータの設定
    const query = {
        'key': process.env.HP_KEY,
        'format': 'json'
    };
    
    if(typeof keys !== 'undefined'){
        logger.log(logger.type.INFO, 'keywords ' + keys);

        keys.map((key)=>{
            keyword += key+' ';
        });

        query.keyword = keyword;
    }
    else if(typeof location !== 'undefined'){
        query.lat = location.latitude;
        query.lng = location.longitude;
    }
    
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
        try { 

            if (!error && response.statusCode == 200) {
                if ('error' in body) {
                    logger.log(logger.type.ERROR, '検索エラー' + JSON.stringify(body));
                    let errms = util.message('見つからないかに…');
                    callback(null, to_array, errms);
                    return;
                }
            }
            
            const res = response.body;
            const shops = res.results.shop;

            let message = [];
            
            if(shops){
            
                result = {
                    name: shops[0].name,
                    shop_image1: shops[0].photo.mobile.l,
                    address: shops[0].address,
                    latitude: shops[0].lat,
                    longitude: shops[0].lng,
                    opentime: shops[0].open
                } ;       
                
                message = [
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
                
            }else {
                message = util.message('見つからないかに…');
            }
            
            callback(null, to_array, message);

        } catch (e) {
            callback(e);
        }

    });

}

module.exports = hotpepper;

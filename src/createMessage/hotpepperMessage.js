const request = require('request');
const logger = require('../logger');
const util = require('../util');
const redis = require('redis');

//hotpepper apiつーかう
function hotpepperMessage(option, client, to_array, callback) {
    let message = [];

    console.log('kanikani:::option?:'+JSON.stringify(option));

    //"他には？" なのでshopsから返す
    if(option.other){
        try{
            client.get('shopIndex', (err, index)=>{
                index++;
                client.get('shop'+index, (err, shopJ)=>{
                    const shop = JSON.parse(shopJ);

                    if(shop){
                        client.set('shopIndex', index, redis.print);
                        result = {
                            name: shop.name,
                            shop_image1: shop.photo.mobile.l,
                            address: shop.address,
                            latitude: shop.lat,
                            longitude: shop.lng,
                            opentime: shop.open
                        } ;  
                        
                        let text = 'こちらはいかがですかに？\n【お店】' + result.name + '\n【営業時間】' + result.opentime;
                        let imageArray = [];
                        imageArray.push(result.shop_image1);
                        let location = {
                            name:result.name,
                            title:result.address,
                            lat:Number(result.latitude),
                            lng:Number(result.longitude)
                        };
                        message = util.textImageLocation(text,imageArray,location);
                        
                    }else {
                        message = util.message('見つからないかに…');
                    }
                    
                    callback(null, to_array, message);
                });
            });
        }catch(e){
            message = util.message('見つからないかに…');
            callback(null, to_array, message);
        }
        return;
    }

    // Hotpepper レストラン検索API
    const url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
    //logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

    const keys = option.gkey;
    const location = option.location;

    // HotPepper リクエストパラメータの設定
    const query = {
        'key': process.env.HP_KEY,
        'format': 'json'
    };
    
    if(typeof keys !== 'undefined'){
        logger.log(logger.type.INFO, 'hMessage: keywords ' + keys);
        query.keyword = keys;
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
            //console.log(JSON.stringify(body));
            if (!error && response.statusCode == 200) {
                if ('error' in body) {
                    logger.log(logger.type.ERROR, 'hMessage: 検索エラー' + JSON.stringify(body));
                    let errms = util.message('見つからないかに…');
                    callback(null, to_array, errms);
                    return;
                }
            }
            
            const res = response.body;
            const shops = res.results.shop;
            
            if(shops){
                console.log('shopIndex:::0');
                client.set('shopIndex', '0', redis.print);

                let i=0;
                shops.forEach(()=>{
                    let shopJ = JSON.stringify(shops[i]);
                    client.set('shop'+i, shopJ, redis.print);
                    i++;
                });

                result = {
                    name: shops[0].name,
                    shop_num: i,
                    shop_image1: shops[0].photo.mobile.l,
                    address: shops[0].address,
                    latitude: shops[0].lat,
                    longitude: shops[0].lng,
                    opentime: shops[0].open
                } ;       
                
                let text = i+'店見つかりました！\nこちらはいかがですかに？\n【お店】' + result.name + '\n【営業時間】' + result.opentime;
                let imageArray = [];
                imageArray.push(result.shop_image1);
                let location = {
                    name:result.name,
                    title:result.address,
                    lat:Number(result.latitude),
                    lng:Number(result.longitude)
                };
                message = util.textImageLocation(text,imageArray,location);
                
            }else {
                message = util.message('見つからないかに…');
            }
            
            callback(null, to_array, message);

        } catch (e) {
            callback(e);
        }

    });

}

module.exports = hotpepperMessage;

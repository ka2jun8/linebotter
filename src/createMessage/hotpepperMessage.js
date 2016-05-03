const request = require('request');
const logger = require('../logger');
const util = require('../util');
const redis = require('redis');

//hotpepper apiつーかう
function hotpepperMessage(option, client, to_array, callback) {
    let message = [];

    let setShop = (shop)=>{
        console.log('shop?'+JSON.stringify(shop));
        return {
            name: shop.name,
            shop_image1: shop.photo.mobile.l,
            address: shop.address,
            latitude: shop.lat,
            longitude: shop.lng,
            opentime: shop.open,
            url: shop.urls.mobile
        } ;  
    };
    let setMessage = (result)=>{
        return {
            text : 'こちらはいかがですかに？\n【お店】' + result.name + '\n【営業時間】' + result.opentime + '\n URL:'+result.url,
            imageArray: [result.shop_image1],
            location : {
                name:result.name,
                title:result.address,
                lat:Number(result.latitude),
                lng:Number(result.longitude)
            }
        };
    };

    //"他には？" なのでshopsから返す
    if(option.other){
        try{
            client.get('shopIndex', (err, index)=>{
                index++;
                client.get('shop'+index, (err, shopJ)=>{
                    const shop = JSON.parse(shopJ);

                    if(shop){
                        client.set('shopIndex', index, redis.print);
                        let result = setShop(shop);
                        const mObj = setMessage(result);
                        message = util.textImageLocation(mObj.text,mObj.imageArray,mObj.location);
                        
                    }else {
                        message = util.message('見つからないかに…');
                    }
                    
                    callback(null, to_array, message);
                });
            });
        }catch(e){
            callback('エラーかに…'+e);
        }
    }
    
    //初回検索時
    else{

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
                    result = setShop(shops[0]);       
                    const mObj = setMessage(result);
                    message = util.textImageLocation(mObj.text,mObj.imageArray,mObj.location);
                    
                }else {
                    message = util.message('見つからないかに…');
                }
                
                callback(null, to_array, message);

            } catch (e) {
                callback(e);
            }

        });
    }

}

module.exports = hotpepperMessage;

//mapsearch
const request = require('request');
const util = require('../util');
const logger = require('../logger');

function mapsearchMessage(option, to_array, callback){  
    // Google MAP 検索 API
    let url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);

    logger.log(logger.type.INFO, 'kani::: mapsearchMessage: '+JSON.stringify(option));

    let to = option.to;

    let slice = to.indexOf('ってどこ');
    to = to.substring(0, slice);
    
    // Google map api リクエストパラメータの設定
    const query = {
        'key': process.env.GMAPKEY,
        'query': to
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

    request.get(options, function (error, response) {
        try { 
            //console.log(JSON.stringify(response));
          
            const res = response.body;
            const results = res.results[0];

            let message = [];
            
            if(results.geometry !== 'undefined'){
                const location = results.geometry.location;
            
                result = {
                    name: to,
                    latitude: location.lat,
                    longitude: location.lng
                } ;       
                
                message = [
                    // テキスト
                    {
                        'contentType': 1,
                        'text': '見つけたよ！\n'
                    }
                    /*
                    ,
                    // 位置情報
                    {
                        'contentType':7,
                        'text': result.name,
                        'location':{
                            'title': result.name,
                            'latitude': Number(result.latitude),
                            'longitude': Number(result.longitude)
                        }
                    }*/
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

module.exports = mapsearchMessage;



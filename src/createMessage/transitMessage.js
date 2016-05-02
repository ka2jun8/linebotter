//transit
const requestFrom = require('request');
const requestTo = require('request');
const util = require('../util');
const logger = require('../logger');

function transitMessage(option, to_array, callback){  
  
    // Google MAP 検索 API
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    let responseUrl = 'https://maps.google.com/maps?ie=UTF8';
    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);

    logger.log(logger.type.INFO, 'kani::: transitMessage: '+JSON.stringify(option));

    let goto = option.to;

    let slice = goto.indexOf('から');
    const from = goto.substring(0, slice);
    let slice2 = goto.indexOf('まで');
    const to = goto.substring(slice+2, slice2);
    
    // Google map api リクエストパラメータの設定
    const queryFrom = {
        'key': process.env.GMAPKEY,
        'query': from
    };

    const queryTo = {
        'key': process.env.GMAPKEY,
        'query': to
    };

    const optionFrom = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: queryFrom,
        json: true
    };
    const optionTo = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: queryTo,
        json: true
    };

    // 検索結果をオブジェクト化
    let message = [];

    requestFrom.get(optionFrom, function (error, responseFrom) {
        try { 
            const resFrom = responseFrom.body.results[0];
            
            if(resFrom.geometry !== 'undefined'){
                const locFrom = resFrom.geometry.location;
                responseUrl += '&saddr='+locFrom.lat+','+locFrom.lng;
                
                requestTo.get(optionTo, function (error, responseTo) {
                    //console.log(JSON.stringify(responseTo));
                    
                    const resTo = responseTo.body.results[0];

                    if(resTo.geometry !== 'undefined'){
                        const locTo = resTo.geometry.location;
                        responseUrl += '&daddr='+locTo.lat+','+locTo.lng;

                        message = [
                            // テキスト
                            {
                                'contentType': 1,
                                'text': 'こんな感じかに〜\n'+responseUrl
                            }
                        ];
                    
                    }else {
                        message = util.message('見つからないかに…');
                    }
                
                    callback(null, to_array, message);

                }.bind(this));

            }else {
                message = util.message('見つからないかに…');
            }
                        
        } catch (e) {
            callback(e);
        }

    }.bind(this));
}

module.exports = transitMessage;



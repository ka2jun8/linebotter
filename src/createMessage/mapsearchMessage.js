//mapsearch
//const request = require('request');
const util = require('../util');
const logger = require('../logger');
const mapSearch = require('../utility/mapSearch');

function mapsearchMessage(option, to_array, callback){  
    // Google MAP 検索 API
    //let url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);
    logger.log(logger.type.INFO, 'kani::: mapsearchMessage: '+JSON.stringify(option));

    let to = option.to;

    let slice = to.indexOf('ってどこ');
    to = to.substring(0, slice);

    let message = [];

    let mapMessage = (err, result) => {
        if(err || !result){
            callback('エラーかに...'); 
        }
        
        if(result){
            message = [
                // テキスト
                {
                    'contentType': 1,
                    'text': '見つけたよ！\n'
                },
                // 位置情報
                {
                    'contentType':7,
                    'text': result.name,
                    'location':{
                        'title': result.title,
                        'latitude': Number(result.lat),
                        'longitude': Number(result.lng)
                    }
                }
            ];
            console.log('kani:::'+JSON.stringify(message)+'/'+to_array[0]);            
        }else {
            message = util.message('見つからないかに…');
        }
        
        callback(null, to_array, message);
    };

    mapSearch(to, mapMessage);    
    
}

module.exports = mapsearchMessage;



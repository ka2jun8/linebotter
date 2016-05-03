const request = require('request');
const xml2json = require('xml2json');
const logger = require('../logger');
const util = require('../util');
const mapSearch = require('../utility/mapSearch');

//天気api
function weatherMessage(wpoint, to_array, callback) {
    // Yahoo天気api 
    const url = 'http://weather.olp.yahooapis.jp/v1/place';
    //logger.log(logger.type.INFO, 'yahoo weather: ' + process.env.YAPPID);
    
    logger.log(logger.type.INFO, 'weatherMessage: ');

    let place=null;
    if(wpoint.indexOf('の')!=-1){
        place = wpoint.substring(0, wpoint.indexOf('の'));
    }
    else if(wpoint.indexOf('は')!=-1){
        place = wpoint.substring(0, wpoint.indexOf('は'));
    }
    else if(wpoint.indexOf(' ')!=-1){
        place = wpoint.substring(0, wpoint.indexOf(' '));
    }
    else if(wpoint.indexOf('、')!=-1){
        place = wpoint.substring(0, wpoint.indexOf('、'));
    }
    
    let location = {};
    
    const locationMessage = (err, location)=>{
      
        if(err || !location){
            console.log(err);
            callback(err);
        }
      
        // yahoo天気 リクエストパラメータの設定
        const query = {
            appid: process.env.YAPPID,
            coordinates: location.lng+','+location.lat
        };
        
        const options = {
            url: url,
            //proxy: process.env.PROXY,
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            qs: query,
            json: true
        };

        logger.log(logger.type.INFO, 'weatherMessage: query:'+JSON.stringify(query));
        request.get(options, function (error, response /*, body*/) {
            try { 
                const xml = response.body;
                const _json = xml2json.toJson(xml);
                const obj = JSON.parse(_json);
                const weathers = obj.YDF.Feature.Property.WeatherList.Weather;
                console.log(JSON.stringify(weathers));
                const rainfall = Number(weathers[0].Rainfall)*100;
                
                let message = [];
                let text = location.name+'近辺の現在の降水強度は、'+rainfall+'%かに\n ※降水強度（単位：mm/h）';
                
                message = util.message(text); 

                callback(null, to_array, message);

            } catch (e) {
                console.log(e);
                callback(e);
            }

        });

    };
    
    if(place){
        mapSearch(place, locationMessage);

    }else{ 
        //デフォルト武蔵中原
        location = {
            name:'武蔵中原駅',
            lat:'35.581154',
            lng:'139.641474'
        };
        
        locationMessage(null, location);
    }
    


}

module.exports = weatherMessage;
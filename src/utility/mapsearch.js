//mapsearch
const request = require('request');
const logger = require('../logger');

function mapSearch(place, _callback){  
    // Google MAP 検索 API
    let url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);
    logger.log(logger.type.INFO, 'kani::: mapSearch: '+place);

    // Google map api リクエストパラメータの設定
    const query = {
        'key': process.env.GMAPKEY,
        'query': place
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
            const res = response.body;
            const results = res.results[0];
            
            if(results.geometry !== 'undefined'){
                const location = results.geometry.location;
            
                result = {
                    name: place,
                    lat: location.lat,
                    lng: location.lng
                };
                
            }
            else{
                result = null;
            }
            
            logger.log(logger.type.INFO, 'mapSearch result: '+JSON.stringify(result));  
            _callback(null, result);

        } catch (e) {

            _callback(e);
        }

    });
}

module.exports = mapSearch;



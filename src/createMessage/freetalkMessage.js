const request = require('request');
const logger = require('../logger');
const util = require('../util');

//雑談api
function freetalkMessage(args, to_array, callback) {

    // DOCOMO雑談api 
    const url = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue?APIKEY='+process.env.DOCOMOKEY;
    //logger.log(logger.type.INFO, 'freetalk docomo: ' + process.env.DOCOMOKEY);

    console.log('Message: args.text'+args.text);
    
    // HotPepper リクエストパラメータの設定
    const query = {
        'utt':args.text
        /*
        "context":"10001",
        "user":"99999",
        "nickname":"光",
        "nickname_y":"ヒカリ",
        "sex":"女",
        "bloodtype":"B",
        "birthdateY":"1997",
        "birthdateM":"5",
        "birthdateD":"30",
        "age":"16",
        "constellations":"双子座",
        "place":"東京",
        "mode":"dialog",
        "t":"20"
        */
    };
    
    const options = {
        url: url,
        proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    request.post(options, function (error, response, body) {
        try { 

            if (!error && response.statusCode == 200) {
                if ('error' in body) {
                    logger.log(logger.type.ERROR, 'Message: 検索エラー' + JSON.stringify(body));
                    let errms = util.message('かにかに〜♪');
                    callback(null, to_array, errms);
                    return;
                }
            }
            
            const res = response.body;
            const utt = res.results.utt;
            let message = util.message(utt);
            callback(null, to_array, message);

        } catch (e) {
            callback(e);
        }

    });

}

module.exports = freetalkMessage;
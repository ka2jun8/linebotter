const request = require('request');
const logger = require('../logger');
const util = require('../util');

//雑談api
function freetalkMessage(content, to_array, callback) {
    // DOCOMO雑談api 
    const url = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue?APIKEY='+process.env.DOCOMOKEY;
    //logger.log(logger.type.INFO, 'freetalk docomo: ' + process.env.DOCOMOKEY);

    logger.log(logger.type.INFO, 'FreetalkMessage: args.text:'+content.text);
    
    // HotPepper リクエストパラメータの設定
    const query = {
        'utt':content.text
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
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: query,
        json: true
    };

    request.post(options, function (error, response /*, body*/) {
        try { 
            const res = response.body;
            let utt = res.utt;
            
            //TODO 語尾をかえる？
            let tmp = utt.substring(0, utt.length-1);
            let last = utt.substring(utt.length-1);
            if(last === ' ' || last === '笑'){
                utt = tmp;
            }
            else if(last === '。' || last === '！' || last === '？'){
                utt = tmp + 'かに' + last;
            }else {
                utt = utt + 'かに';
            }

            let message = util.message(utt);
            
            callback(null, to_array, message);

        } catch (e) {
            console.log(e);
            callback(e);
        }

    });

}

module.exports = freetalkMessage;
var request = require('request');
var xml2json = require('xml2json');

//形態素解析的な。会話を理解したい
function parser(text, client, json, callback) {
    // Hotpepper レストラン検索API
    var url = 'http://jlp.yahooapis.jp/MAService/V1/parse';

    console.log('yparser = ' + process.env.YAPPID);

    // ぐるなび リクエストパラメータの設定
    var query = {
        'appid': process.env.YAPPID,
        'sentence': text
    };
    var options = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    // 検索結果をオブジェクト化
    //var result = {};

    //console.log('proxy='+process.env.PROXY);
    
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if ('error' in body) {
                console.log('検索エラー' + JSON.stringify(body));
                return;
            }
        }
        
        var xml = response.body;
        var json = xml2json(xml);
        var obj = JSON.prase(json);
        var words = obj.ResultSet.ma_result.word_list.word;

        client.set("string key", "string val", redis.print);

        callback(null, words);
    });

}

module.exports = parser;
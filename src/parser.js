const request = require('request');
const xml2json = require('xml2json');
const redis = require('redis');
const Util = require('./util');

//形態素解析的な。会話を理解したい
function parser(args) {

    //yahoo 形態素解析web api
    const url = 'http://jlp.yahooapis.jp/MAService/V1/parse';

    //console.log('yparser = ' + process.env.YAPPID);
    //console.log("text="+args.text);

    // リクエストパラメータの設定
    const query = {
        'appid': process.env.YAPPID,
        'sentence': args.text
    };
    const options = {
        url: url,
        //proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    request.get(options, function (error, response/*, body*/) {
        /*
        if (!error && response.statusCode == 200) {
            if ('error' in body) {
                console.log('検索エラー' + JSON.stringify(body));
                return;
            }
        }
        */
        
        const xml = response.body;
        const _json = xml2json.toJson(xml);
        const obj = JSON.parse(_json);
        
        console.log(obj);
        const words = obj.ResultSet.ma_result.word_list.word;
        
        console.log(words);

        //トークタイプの判定
        let type = Util.TALKTYPE.OTHER;
        args.client.get('talktype', (err, reply)=> {
            // reply is null when the key is missing
            console.log(reply);
            if(reply){
                type= reply;

                if(type===Util.TALKTYPE.GROUMET){
                    type===Util.TALKTYPE.GROUMET_SEARCH;
                    
                    Object.keys(words).map((word)=>{
                        if(word.pos === '名詞'){
                            args.client.set('groumet_key', type, redis.print);
                        }
                    });
                }
                else if(type===Util.TALKTYPE.OTHER){
                    Object.keys(words).map((word)=>{
                        if(word.reading==='ごはん'){
                            type = Util.TALKTYPE.GROUMET;
                        }
                        else if(word.reading==='かに'){
                            type = Util.TALKTYPE.OTHER;
                        }
                    });
                }
                
                //TODO clientID.number : text に?
                //場所、営業時間をkeyにして保管?
                args.client.set('talktype', type, redis.print);
            }
            console.log('talktype:'+type);

            const _args = {
                type: type,
                words: words,
                text: args.text,
                json: args.json,
                client: args.client,
                to_array: args.to_array
            };
            
            args.callback(null, _args);
        });
    });

}

module.exports = parser;
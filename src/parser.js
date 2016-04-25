const request = require('request');
const xml2json = require('xml2json');
const redis = require('redis');
const Util = require('./util');
const logger = require('./logger');

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
        proxy: process.env.PROXY,
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        qs: query,
        json: true
    };

    request.get(options, function (error, response/*, body*/) {
        const xml = response.body;
        const _json = xml2json.toJson(xml);
        const obj = JSON.parse(_json);
        const word_list = obj.ResultSet.ma_result.word_list;

        let words = [];
        if(!Array.isArray(word_list.word)){
            words.push(word_list.word);
        }else{
            words = word_list.word; 
        }
        //console.log(words);

        //トークタイプの判定
        let type = Util.TALKTYPE.OTHER;
        args.client.get('talktype', (err, reply)=> {
            //一つ前のトークタイプ
            logger.log(logger.type.INFO, 'previous talktype '+reply);
            //console.log('reply='+reply);
            
            if(reply){
                type= reply;
            }
            if(type==Util.TALKTYPE.GROUMET){ //2
                //console.log('type groumet');
                type=Util.TALKTYPE.GROUMET_SEARCH; //2-1
                
                words.map((word)=>{
                    if(word.pos === '名詞'){
                        args.client.set('groumet_key', type, redis.print);
                    }
                });
                
            }
            else if(type==Util.TALKTYPE.OTHER){ //0
                //console.log('type other');
                words.map((word)=>{
                    if(word.reading==='ごはん'){
                        type = Util.TALKTYPE.GROUMET;
                    }
                    else if('おはよう' in word.reading){
                        type = Util.TALKTYPE.OHA;
                    }
                    else if('こんにち' in word.reading){
                        type = Util.TALKTYPE.KONNICHIWA;
                    }
                    else if('こんばん' in word.reading){
                        type = Util.TALKTYPE.KONBANWA;
                    }
                    else if(word.reading==='かに'){
                        type = Util.TALKTYPE.OTHER;
                    }
                });
            }
            else if(type==Util.TALKTYPE.ERROR){ //-1
                console.log('AFTER ERROR: {'+typeof type+'}'+type);
                type = Util.TALKTYPE.OTHER;
            }else{
                console.log('ERROR: {'+typeof type+'}'+type);
                type = Util.TALKTYPE.ERROR;
            }
            
            //TODO clientID.number : text に?
            //場所、営業時間をkeyにして保管?
            args.client.set('talktype', type, redis.print);
            logger.log(logger.type.INFO, 'set talktype '+type);

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
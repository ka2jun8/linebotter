const request = require('request');
const xml2json = require('xml2json');
const redis = require('redis');
const Util = require('./util');
const logger = require('./logger');

//TODO 〜時に〜して、というスケジューラ機能?

//形態素解析的な。会話を理解したい
function parser(args) {

    //yahoo 形態素解析web api
    const url = 'http://jlp.yahooapis.jp/MAService/V1/parse';
    //logger.log(logger.type.INFO, 'yahooid: ' + process.env.YAPPID);

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
        const xml = response.body;
        const _json = xml2json.toJson(xml);
        const obj = JSON.parse(_json);
        const word_list = obj.ResultSet.ma_result.word_list.word;        

        //引数オプション
        let option = {
            gkey:[] //ぐるめ検索キーワード
        }; 

        let words = [];
        words.push(word_list);
        //TODO スタンプがエラーになるっぽい?
        if(!Array.isArray(word_list)){
            words.push(word_list);
        }else{
            word_list.forEach((word)=>{
                words.push(word);
            });
        }

        //トークタイプの判定
        let type = Util.TALKTYPE.OTHER;
        args.client.get('talktype', (err, reply)=> {
            //一つ前のトークタイプ
            if(reply){
                logger.log(logger.type.INFO, 'previous talktype '+reply);
                type= JSON.parse(reply);
            }
            try{
                //set talktype
                if(type.key==Util.TALKTYPE.OTHER.key){ //0
                    words.map((word)=>{
                        //logger.log(logger.type.INFO, type+':'+word);
                        if(word.reading==='ごはん'){
                            type = Util.TALKTYPE.GROUMET;
                        }
                        /////GREETING//////
                        else if(word.reading.indexOf('おはよう')!=-1){
                            type = Util.TALKTYPE.GREETING.OHA;
                        }
                        else if(word.reading.indexOf('こんにち')!=-1){
                            type = Util.TALKTYPE.GREETING.KONNICHIWA;
                        }
                        else if(word.reading.indexOf('こんばん')!=-1){
                            type = Util.TALKTYPE.GREETING.KONBANWA;
                        }
                        ///////////////////
                        else{
                            type = Util.TALKTYPE.OTHER;
                        }
                    });
                }
                else if(type.key==Util.TALKTYPE.GROUMET.key){ //2
                    type=Util.TALKTYPE.GROUMET.GROUMET_SEARCH; //2-1
                    words.map((word)=>{
                        if(word.pos === '名詞'){
                            option.gkey.push(word.surface);
                            //args.client.set('groumet_key', type, redis.print);
                        }
                    });
                }else{
                    type = Util.TALKTYPE.OTHER;
                }
            }catch(e){
                logger.log(logger.type.ERROR, 'ERROR: {'+typeof type+'}'+type+'/'+e);
                type = Util.TALKTYPE.ERROR; 
            }
            
            //Redis にtalktypeを保管
            args.client.set('talktype', JSON.stringify(type), redis.print);
            logger.log(logger.type.INFO, 'set talktype '+JSON.stringify(type));

            //引数設定
            const _args = {
                type: type,
                words: words,
                option: option,
                to_array: args.to_array,
                text: args.text,
                json: args.json,
                client: args.client
            };
            
            //先頭nullで成功を示す
            args.callback(null, _args);
        });
    });

}

module.exports = parser;
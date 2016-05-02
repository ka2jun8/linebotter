const request = require('request');
const xml2json = require('xml2json');
const redis = require('redis');
const util = require('./util');
const logger = require('./logger');

//TODO 〜時に〜して、というスケジューラ機能?

//形態素解析的な。会話を理解したい
function parseText(previous, args) {

    //yahoo 形態素解析web api
    const url = 'http://jlp.yahooapis.jp/MAService/V1/parse';
    //logger.log(logger.type.INFO, 'yahooid: ' + process.env.YAPPID);

    // リクエストパラメータの設定
    const query = {
        'appid': process.env.YAPPID,
        'sentence': args.content.text
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

        let text = args.content.text;
        let words = [];
        if(!Array.isArray(word_list)){
            words.push(word_list);
        }else{
            word_list.forEach((word)=>{
                words.push(word);
            });
        }
        logger.log(logger.type.INFO, 'parseText words: '+JSON.stringify(words));

        //引数オプション        
        let option = {
            gkey: [], //グルメ検索キーワード
            time: '', //アラーム分後
            goto: [] //行きたいところ
        };

        //トークタイプの判定
        let type = {};
        //previous; //前回のtype -> 一つ前によってオートマトン
        try{
            //set talktype
            if(previous.key==util.TALKTYPE.OTHER.key){ //0
                //logger.log(logger.type.INFO, type+':'+word);
                if(util.checkText(util.TALKTYPE.GROUMET.value, words, text)){
                    type = util.TALKTYPE.GROUMET;
                }
                /////GREETING//////
                else if(util.checkText(util.TALKTYPE.GREETING.OHA.value, words, text)){
                    type = util.TALKTYPE.GREETING.OHA;
                }
                else if(util.checkText(util.TALKTYPE.GREETING.KONNICHIWA.value, words, text)){
                    type = util.TALKTYPE.GREETING.KONNICHIWA;
                }
                else if(util.checkText(util.TALKTYPE.GREETING.KONBANWA.value, words, text)){
                    type = util.TALKTYPE.GREETING.KONBANWA;
                }
                ////////TALK//////////
                else if(util.checkText(util.TALKTYPE.TALK.KAWAII.value, words, text)){
                    type = util.TALKTYPE.TALK.KAWAII;
                }
                else if(util.checkText(util.TALKTYPE.TALK.ARIGATO.value, words, text)){
                    type = util.TALKTYPE.TALK.ARIGATO;
                }
                else if(util.checkText(util.TALKTYPE.TALK.LOVE.value, words, text)){
                    type = util.TALKTYPE.TALK.LOVE;
                }
                else if(util.checkText(util.TALKTYPE.TALK.WHATTIME.value, words, text)){
                    type = util.TALKTYPE.TALK.WHATTIME;
                }
                ////////アラーム////////////
                else if(util.checkText(util.TALKTYPE.ALARM.value, words, text)){
                    type = util.TALKTYPE.ALARM;
                }
                /////////友達登録///////////
                else if(util.checkText(util.TALKTYPE.FRIEND.value, words, text)){
                    type = util.TALKTYPE.FRIEND;
                }
                else if(util.checkText(util.TALKTYPE.FRIEND.REGISTER.value, words, text)){
                    type = util.TALKTYPE.FRIEND.REGISTER;
                }
                else if(util.checkText(util.TALKTYPE.FRIEND.UNREGISTER.value, words, text)){
                    type = util.TALKTYPE.FRIEND.UNREGISTER;
                }
                ////////マップ////////////
                else if(util.checkText(util.TALKTYPE.GMAP.WHERE.value, words, text)){
                    type = util.TALKTYPE.GMAP.WHERE;
                    option.maptarget = text;
                }
                else if(util.checkText(util.TALKTYPE.GMAP.GOTO.value, words, text)){
                    type = util.TALKTYPE.GMAP.GOTO;
                    option.goto = text;
                }
                ///////////////////////////
                else{
                    type = util.TALKTYPE.OTHER;
                }
                ///////////////////
            }
            ////////GROUMET////////
            else if(previous.key==util.TALKTYPE.GROUMET.key){ //2
                type=util.TALKTYPE.GROUMET.GROUMET_SEARCH; //2-1
                words.forEach((word)=>{
                    if(word.pos === '名詞'){
                        option.gkey.push(word.surface);
                    }
                });
            }
            ////////ALARM////////
            else if(previous.key==util.TALKTYPE.ALARM.key){ //
                type=util.TALKTYPE.OTHER; //
                words.forEach((word)=>{
                    if(isFinite(word.surface)){
                        type=util.TALKTYPE.ALARM.ACCEPT;
                        option.time=word.surface;
                    }
                });
            }
            ////////FRIEND////////
            else if(previous.key==util.TALKTYPE.FRIEND.key){ //
                type=util.TALKTYPE.ERROR; //
                words.forEach((word)=>{
                    if(word.reading.indexOf('する')!=-1){
                        type = util.TALKTYPE.FRIEND.REGISTER;
                    }
                });
            }
            ////////////////////////
            else{
                type = util.TALKTYPE.OTHER;
            }
            ////////////////////////
        }catch(e){
            logger.log(logger.type.ERROR, 'ERROR: '+JSON.stringify(type)+'/'+e);
            type = util.TALKTYPE.ERROR; 
        }
        
        //Redis にtalktypeを保管
        args.client.set('talktype', JSON.stringify(type), redis.print);
        logger.log(logger.type.INFO, 'Parser: set talktype '+JSON.stringify(type));

        //引数設定
        const _args = {
            type: type,
            text: text,
            option: option,
            to_array: args.to_array,
            client: args.client
        };
        
        //先頭nullで成功を示す
        args.callback(null, _args);
    });

}

module.exports = parseText;
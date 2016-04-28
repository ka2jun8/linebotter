const request = require('request');
const xml2json = require('xml2json');
const redis = require('redis');
const Util = require('./util');
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
            time: '' //アラーム分後
        };

        //トークタイプの判定
        let type = {};
        //previous; //前回のtype -> 一つ前によってオートマトン
        try{
            //set talktype
            if(previous.key==Util.TALKTYPE.OTHER.key){ //0
                words.map((word)=>{
                    //logger.log(logger.type.INFO, type+':'+word);
                    if(word.reading==='ごはん'){
                        type = Util.TALKTYPE.GROUMET;
                    }
                    /////GREETING//////
                    else if(word.reading.indexOf('おはよ')!=-1){
                        type = Util.TALKTYPE.GREETING.OHA;
                    }
                    else if(word.reading.indexOf('こんにち')!=-1
                        || word.reading.indexOf('ハロー')!=-1){
                        type = Util.TALKTYPE.GREETING.KONNICHIWA;
                    }
                    else if(word.reading.indexOf('こんばん')!=-1){
                        type = Util.TALKTYPE.GREETING.KONBANWA;
                    }
                    ///////////////////
                    else if(text==='かわいい？'){
                        type = Util.TALKTYPE.TALK.KAWAII;
                    }
                    else if(word.reading.indexOf('ありがと')!=-1){
                        type = Util.TALKTYPE.TALK.ARIGATO;
                    }
                    else if(word.reading.indexOf('すき')!=-1 || word.reading.indexOf('あいしてる')!=-1){
                        type = Util.TALKTYPE.TALK.LOVE;
                    }
                    else if(word.reading.indexOf('なんじ')!=-1){
                        type = Util.TALKTYPE.TALK.WHATTIME;
                    }
                    else if(word.reading.indexOf('あらーむ')!=-1){
                        type = Util.TALKTYPE.ALARM;
                    }
                    /////////友達登録///////////
                    else if(word.reading.indexOf('ともだち')!=-1){
                        type = Util.TALKTYPE.FRIEND;
                    }
                    else if(text==='友達登録'){
                        type = Util.TALKTYPE.FRIEND.REGISTER;
                    }
                    else if(text==='友達解除'){
                        type = Util.TALKTYPE.FRIEND.UNREGISTER;
                    }
                    ///////////////////////////
                    else{
                        type = Util.TALKTYPE.OTHER;
                    }
                    ///////////////////
                });
            }
            ////////GROUMET////////
            else if(previous.key==Util.TALKTYPE.GROUMET.key){ //2
                type=Util.TALKTYPE.GROUMET.GROUMET_SEARCH; //2-1
                words.map((word)=>{
                    if(word.pos === '名詞'){
                        option.gkey.push(word.surface);
                    }
                });
            }
            ////////ALARM////////
            else if(previous.key==Util.TALKTYPE.ALARM.key){ //
                type=Util.TALKTYPE.OTHER; //
                words.map((word)=>{
                    console.log('word is' +word);
                    if(isFinite(word.surface)){
                        type=Util.TALKTYPE.ALARM.ACCEPT;
                        option.time=word.surface;
                    }
                });
            }
            ////////FRIEND////////
            else if(previous.key==Util.TALKTYPE.FRIEND.key){ //
                type=Util.TALKTYPE.ERROR; //
                words.map((word)=>{
                    if(word.reading.indexOf('する')!=-1){
                        type = Util.TALKTYPE.FRIEND.REGISTER;
                    }
                });
            }
            ////////////////////////
            else{
                type = Util.TALKTYPE.OTHER;
            }
            ////////////////////////
        }catch(e){
            logger.log(logger.type.ERROR, 'ERROR: '+JSON.stringify(type)+'/'+e);
            type = Util.TALKTYPE.ERROR; 
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
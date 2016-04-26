//const Grnavi = require('./grnavi');
const Hpepper = require('./hotpepper');
const util = require('./util');
const logger = require('./logger');
const redis = require('redis');

//メッセージ-dispatcher
function messanger(args, callback){
    let type = args.type;
    
    try{
        logger.log(logger.type.INFO, JSON.stringify(type)+'/type-key:'+type.key);
        if(type.key===util.TALKTYPE.OTHER.key){
            callback(null, args.to_array, util.message('かにかに〜♪'));
        }
        else if(type.key===util.TALKTYPE.ERROR.key){
            callback(null, args.to_array, util.message('ちょっと理解不能…'));
        }
        /////GREETING//////
        else if(type.key===util.TALKTYPE.GREETING.OHA.key){
            args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
            callback(null, args.to_array, util.message('おはかに♪'));
        }
        else if(type.key===util.TALKTYPE.GREETING.KONNICHIWA.key){
            args.client.set('talktype',  JSON.stringify(util.TALKTYPE.OTHER), redis.print);
            callback(null, args.to_array, util.message('こんにちわかに♪'));
        }
        else if(type.key===util.TALKTYPE.GREETING.KONBANWA.key){
            args.client.set('talktype',  JSON.stringify(util.TALKTYPE.OTHER), redis.print);
            callback(null, args.to_array, util.message('こんばんわかに♪'));
        }
        //////GROUMET///////
        else if(type.key===util.TALKTYPE.GROUMET.key){
            callback(null, args.to_array, util.message('どんなところがいい？'));
        }
        else if(type.key===util.TALKTYPE.GROUMET.GROUMET_SEARCH.key){
            args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
            //ぐるなび検索
            //Grnavi(place, keyword, json, to_array, callback);
            console.log(args.option);

            let gkey = args.option.gkey;
            logger.log(logger.type.INFO, 'search groumet:[key]:'+gkey);
            //ホットペッパー検索
            Hpepper(gkey, args.json, args.to_array, callback);
            
        }else{
            callback('unknown error');
        }
    }catch (err) {
        callback(err);
    }    
  
}

module.exports = messanger;

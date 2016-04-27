//const Grnavi = require('./createMessage/grnaviMessage');
const Hpepper = require('./createMessage/hotpepperMessage');
const freetalk = require('./createMessage/freetalkMessage');
const plain = require('./createMessage/plaintextMessage');
const util = require('./util');
const logger = require('./logger');
const redis = require('redis');

//メッセージ-dispatcher
function messanger(args, callback){
    let type = args.type;
    
    try{
        logger.log(logger.type.INFO, 'messanger => '+'type-key:'+type.key);

        if(type.key===util.TALKTYPE.OTHER.key){
            //callback(null, args.to_array, util.message('かにかに〜♪'));
            freetalk(args.content, args.to_array, callback);
            return;
        }
        else if(type.key===util.TALKTYPE.GROUMET.GROUMET_SEARCH.key){
            args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);

            logger.log(logger.type.INFO, JSON.stringify(args.option));

            //ぐるなび検索
            //Grnavi(place, keyword, json, to_array, callback);

            //ホットペッパー検索
            Hpepper(args.option, args.to_array, callback);
            return;
        }
        else if(type.key===util.TALKTYPE.ERROR.key){
            plain(util.message('ちょっと理解不能…'), args, callback);
        }
        /////GREETING//////
        else if(type.key===util.TALKTYPE.GREETING.OHA.key){
            plain(util.message('おはかに♪'), args, callback);
        }
        else if(type.key===util.TALKTYPE.GREETING.KONNICHIWA.key){
            plain(util.message('こんにちわかに♪'), args, callback);
        }
        else if(type.key===util.TALKTYPE.GREETING.KONBANWA.key){
            plain(util.message('こんばんわかに♪'), args, callback);
        }
        //////GROUMET///////
        else if(type.key===util.TALKTYPE.GROUMET.key){
            callback(null, args.to_array, util.message('どんなところがいい？'));
        }else{
            //ERROR
            callback('unknown error');
        }
        
    }catch (err) {
        //ERROR
        callback(err);
    }    
  
}

module.exports = messanger;

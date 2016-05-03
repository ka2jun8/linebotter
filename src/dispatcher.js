//const Grnavi = require('./createMessage/grnaviMessage');
const Hpepper = require('./createMessage/hotpepperMessage');
const freetalk = require('./createMessage/freetalkMessage');
const plain = require('./createMessage/plaintextMessage');
const mapsearch = require('./createMessage/mapsearchMessage');
const transit = require('./createMessage/transitMessage');
const util = require('./util');
const logger = require('./logger');
const redis = require('redis');
const alarmMessage = require('./createMessage/alarmMessage');

//メッセージ-dispatcher
function dispatcher(args, callback){
    let type = args.type;
    
    try{
        logger.log(logger.type.INFO, 'dispatcher => '+'type-key:'+type.key);

        if(type.key===util.TALKTYPE.OTHER.key){
            //callback(null, args.to_array, util.message('かにかに〜♪'));
            freetalk(args, args.to_array, callback);
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
        /////////友達登録////////////
        else if(type.key===util.TALKTYPE.FRIEND.key){
            args.next = util.TALKTYPE.FRIEND;
            plain(util.message('友達登録するかに？'), args, callback);
        }
        else if(type.key===util.TALKTYPE.FRIEND.REGISTER.key){
            args.client.set('friend.'+args.to_array[0], 'true', redis.print);
            plain(util.message('友達登録したかに〜^^'), args, callback);
        }
        else if(type.key===util.TALKTYPE.FRIEND.UNREGISTER.key){
            args.client.set('friend.'+args.to_array[0], 'false', redis.print);
            plain(util.message('友達解除したかに〜涙'), args, callback);
        }
        //////////アラーム////////////
        else if(type.key===util.TALKTYPE.ALARM.key){
            args.next = util.TALKTYPE.ALARM;
            plain(util.message('何分後に通知してほしいかに？'), args, callback);
        }
        else if(type.key===util.TALKTYPE.ALARM.ACCEPT.key){
            alarmMessage(args);
            plain(util.message('覚えてたら通知するかに！笑   ...あ、もう忘れたかに'), args, callback);
        }
        //////GROUMET///////
        else if(type.key===util.TALKTYPE.GROUMET.key){
            args.next = util.TALKTYPE.GROUMET;
            plain(util.message('どんなところがいいかに？\n※スペースごとキーワードかに！'), args, callback);
        }
        else if(type.key===util.TALKTYPE.GROUMET.GROUMET_SEARCH.key){
            //args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
            //logger.log(logger.type.INFO, JSON.stringify(args.option));
            //ぐるなび検索
            //Grnavi(place, keyword, json, to_array, callback);
            //ホットペッパー検索
            Hpepper(args.option, args.client, args.to_array, callback);
        }
        else if(type.key===util.TALKTYPE.GROUMET.RESULTS.key){
            args.option.other = 'true';
            Hpepper(args.option, args.client, args.to_array, callback);
        }
        //////////マップ////////////
        else if(type.key===util.TALKTYPE.GMAP.WHERE.key){
            if(typeof args.option.maptarget!=='undefined'){
                mapsearch({to:args.option.maptarget}, args.to_array, callback);
            }
            else {
                plain(util.message('行けると良いかにね'), args, callback);
            }
        }
        else if(type.key===util.TALKTYPE.GMAP.GOTO.key){
            if(typeof args.option.goto!=='undefined'){
                args.next = util.TALKTYPE.GMAP.GOTO;
                transit({to:args.option.goto}, args.to_array, callback);
            } else {
                plain(util.message('行けると良いかにね'), args, callback);
            }
        }
        ///////////TALK/////////////
        else if(type.key===util.TALKTYPE.TALK.KAWAII.key){
            plain(util.message('世界でいちばんかわいいよ、食べちゃいたいくらい。ぱくっ'), args, callback);
        }
        else if(type.key===util.TALKTYPE.TALK.ARIGATO.key){
            plain(util.message('どういたかに'), args, callback);
        }
        else if(type.key===util.TALKTYPE.TALK.LOVE.key){
            plain(util.message('あいしてるかに〜☻'), args, callback);
        }
        else if(type.key===util.TALKTYPE.TALK.WHATTIME.key){
            const time = util.calcTime(2);
            plain(util.message('いまアメリカは'+time+'だよ！\n日本はもう９時間遅いかな？'), args, callback);
        }
        ////////////////////
        else{
            //ERROR
            callback('unknown error');
        }
        
    }catch (err) {
        //ERROR
        callback(err);
    }    
  
}

module.exports = dispatcher;

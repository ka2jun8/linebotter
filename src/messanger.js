//const Grnavi = require('./grnavi');
const Hpepper = require('./hotpepper');
const Util = require('./util');
const logger = require('./logger');
const redis = require('redis');

function messanger(args, callback){
    let type = args.type;
    if(type===Util.TALKTYPE.OTHER){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'かにかに〜♪'
            }
        ];
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.ERROR){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'ちょっと理解不能…'
            }
        ];
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.OHA){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'おはかに♪'
            }
        ];
        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.KONNICHIWA){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'こんにちわかに♪'
            }
        ];
        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.KONBANWA){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'こんばんわかに♪'
            }
        ];
        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.GROUMET){
        let message = [
            // テキスト
            {
                'contentType': 1,
                'text': 'どんなところがいい？'
            }
            //TODO 場所、キーワード///
        ];
        callback(null, args.to_array, message);
    }
    else if(type===Util.TALKTYPE.GROUMET_SEARCH){
        args.client.get('groumet_key', (err, reply)=> {
            let place = reply;
            
            logger.log(logger.type.INFO, 'search groumet:[key]:'+reply);

            //ぐるなび検索
            //Grnavi(place, keyword, json, to_array, callback);
            //ホットペッパー検索
            Hpepper(place, '', args.json, args.to_array, callback);

        });

    }
    
  
}

module.exports = messanger;

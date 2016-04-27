const tparser = require('./textParser');
const logger = require('./logger');
const redis = require('redis');
const util = require('./util');

function contentParser (args) {
    //トークタイプの判定
    let type = util.TALKTYPE.OTHER;
    
    //スタンプや位置情報、画像などを取り出し
    let location = {};
    if(args.content.contentType==1){
        //textだよ
        tparser(args);
        return;
    }
    else if(args.content.contentType==2){
        //imageだよ
    }
    else if(args.content.contentType==7){
        //locationだよ
        location = args.content.location;
        logger.log(logger.type.INFO, location);
    }
    else if(args.content.contentType==8){
        //stickerスタンプだよ
    }

    //引数オプション
    let option = {
        glocation: location //ぐるめロケーション
    }; 

    //Redis にtalktypeを保管
    args.client.set('talktype', JSON.stringify(type), redis.print);
    logger.log(logger.type.INFO, 'set talktype '+JSON.stringify(type));

    //引数設定
    const _args = {
        type: type,
        option: option,
        to_array: args.to_array,
        client: args.client
    };
    
    //先頭nullで成功を示す
    args.callback(null, _args);
}

module.exports = contentParser;
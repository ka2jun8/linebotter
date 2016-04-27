const textParser = require('./parseText');
const logger = require('./logger');
const redis = require('redis');
const util = require('./util');

function parseContent (args) {
    //トークタイプの判定
    let type = util.TALKTYPE.OTHER;
        
    args.client.get('talktype', (err, reply)=> {
        //スタンプや位置情報、画像などを取り出し
        let location = {};

        //一つ前のトークタイプ
        let previous;
        if(reply){
            logger.log(logger.type.INFO, 'Parser: previous talktype '+reply);
            try{
                previous= JSON.parse(reply);
            }catch(e){
                previous=util.TALKTYPE.OTHER;
            }
        }
        
        //Contentによって分岐
        if(args.content.contentType==1){
            //textだよ
            textParser(previous, args);
            return;
        }
        else if(args.content.contentType==2){
            //imageだよ
            //
        }
        else if(args.content.contentType==7){
            //locationだよ
            if(previous == util.TALKTYPE.GROUMET){
                type = util.TALKTYPE.GROUMET.GROUMET_SEARCH;
                location = args.content.location;
                logger.log(logger.type.INFO, 'Parser:'+JSON.stringify(location));
            }
        }
        else if(args.content.contentType==8){
            //stickerスタンプだよ
            //
        }

        //引数オプション
        let option = {
            glocation: location //ぐるめロケーション
        }; 

        //Redis にtalktypeを保管
        args.client.set('talktype', JSON.stringify(type), redis.print);
        logger.log(logger.type.INFO, 'Parser: set talktype '+JSON.stringify(type));

        //引数設定
        const _args = {
            type: type,
            option: option,
            to_array: args.to_array,
            client: args.client
        };
        //先頭nullで成功を示す => dispatcher
        args.callback(null, _args);

    });
        

}

module.exports = parseContent;
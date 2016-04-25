const Grnavi = require('./grnavi');
const Hpepper = require('./hotpepper');
const Util = require('./util');

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
            //ぐるなび検索
            //Grnavi(place, keyword, json, to_array, callback);
            //ホットペッパー検索
            Hpepper(place, keyword, args.json, args.to_array, callback);

        });

    }
    
  
}

module.exports = messanger;
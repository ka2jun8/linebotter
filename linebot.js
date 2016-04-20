var request = require('request');

function linebot(err, json, search_result) {

    if(err){
        return;
    }

    //ヘッダーを定義
    var headers = {
        'Content-Type' : 'application/json; charset=UTF-8',
        'X-Line-ChannelID' : process.env.LINE_CHANNELID, 
        'X-Line-ChannelSecret' : process.env.LINE_SECRET, 
        'X-Line-Trusted-User-With-ACL' : process.env.LINE_MID 
    };

    // 送信相手の設定（配列）
    var to_array = [];
    to_array.push(json['result'][0]['content']['from']);

    // 送信データ作成
    var data = {
        'to': to_array,
        'toChannel': 1383378250, //固定
        'eventType':'140177271400161403', //固定
        'content': {
            'messageNotified': 0,
            'messages': [
                // テキスト
                {
                    'contentType': 1,
                    'text': 'こちらはいかがですか？\n【お店】' + search_result['name'] + '\n【営業時間】' + search_result['opentime']
                },
                // 画像
                {
                    'contentType': 2,
                    'originalContentUrl': search_result['shop_image1'],
                    'previewImageUrl': search_result['shop_image1']
                },
                // 位置情報
                {
                    'contentType':7,
                    'text': search_result['name'],
                    'location':{
                        'title': search_result['address'],
                        'latitude': Number(search_result['latitude']),
                        'longitude': Number(search_result['longitude'])
                    }
                }
            ]
        }
    };
    
    console.log('kani::: data= '+ JSON.stringify(data));
    //console.log('proxy-url : '+process.env.FIXIE_URL);
    
    //オプションを定義
    var options = {
        url: 'https://trialbot-api.line.me/v1/events',
        //proxy : process.env.FIXIE_URL,
        headers: headers,
        json: true,
        body: data
    };

    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
        } else {
            console.log('error: '+ JSON.stringify(response));
        }
    });

}

module.exports = linebot;


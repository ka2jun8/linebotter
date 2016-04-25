var request = require('request');

function linebot(err, to_array, message) {

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

    // 送信データ作成
    var data = {
        'to': to_array,
        'toChannel': 1383378250, //固定
        'eventType':'140177271400161403', //固定
        'content': {
            'messageNotified': 0,
            'messages': message
        }
    };
    
    console.log('kani::: data= '+ JSON.stringify(data));
    //console.log('proxy-url : '+process.env.FIXIE_URL);
    
    //オプションを定義
    var options = {
        url: 'https://trialbot-api.line.me/v1/events',
        //proxy : process.env.PROXY,
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


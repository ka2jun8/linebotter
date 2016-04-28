//ぐるなび＋Line bot

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const async = require('async');
const cparser = require('./parseContent');
const Linebot = require('./linebot');
const redis = require('redis');
const client = redis.createClient();
//const Util = require('./util');
const dispatcher = require('./dispatcher');
const Log4js = require('log4js');
Log4js.configure('log-config.json');
let log4js = Log4js.getLogger('system');
app.use(Log4js.connectLogger(log4js));
const logger = require('./logger');
const util = require('./util');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));  // JSONの送信を許可
app.use(bodyParser.json());                        // JSONのパースを楽に（受信時）

//pulic フォルダを公開する
//app.use(express.static('public'));

//TODO
//並列処理＋エラー処理
//エスケープシーケンス
//署名検証 
//画像認識 「これ何？」
//「〜〜まで行きたい」
//ここから〜〜までの行き方 //位置情報
//スタンプ対応
//傘必要な日は毎朝教えて欲しい
//健康
//みんな（友達）に発言する
//redis search & register
//アラーム時間差で

//test
app.get('/', function(req, res) {
    //console.log('kani::: '+JSON.stringify(req.body));
    //res.sendFile(__dirname+'index.html');
    res.send('Hello World!');
});

app.post('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    res.send('Hello World!');
});

//Linebot-callback
app.post('/callback', function(req, res){
    //console.log('kani::: '+JSON.stringify(req.body));
    async.waterfall([
        //Receive line message
        function(callback) {
            var json = req.body;

            // 送信相手の設定（配列）
            let to_array = [];
            const to = json['result'][0]['content']['from'];
            to_array.push(to);
            //受信メッセージ
            const content = json.result[0].content;

            logger.log(logger.type.INFO, 'INDEX: Line=>('+to+'):'+JSON.stringify(content));

            //redis接続
            client.on('error', function (err) {
                console.log('Error ' + err);
            });

            //関数呼び出し用引数
            const args = {
                to_array: to_array,
                content: content,
                client: client,
                callback: callback
            };

            //さきに200返しておく
            res.send('Receive ['+to+']:'+JSON.stringify(content));

            //content parse & set talktype
            cparser(args);
        },
        
        //message dispatcher
        function(_args, callback){
            
            const args2 = {
                type: _args.type,
                text: _args.text,
                option: _args.option,
                to_array: _args.to_array,
                client: _args.client
            };
            
            dispatcher(args2, callback);
        }
    ],

    // LINE BOT
    function(err, to_array, message) {
        if(err){
            logger.log(logger.type.ERROR, err);
            const errm = util.message('なんかエラーがおきたみたい');
            message = errm;
        }
        Linebot(to_array, message);
    });

});


app.listen(app.get('port'), function() {
    console.log('Node app is running');
});
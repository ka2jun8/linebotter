//ぐるなび＋Line bot

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var async = require('async');
var parser = require('./parser');
//var Grnavi = require('./grnavi');
//var Hpepper = require('./hotpepper');
var Linebot = require('./linebot');
var redis = require('redis');
var client = redis.createClient();
//const Util = require('./util');
const messanger = require('./messanger');
const Log4js = require('log4js');
Log4js.configure('log-config.json');
let log4js = Log4js.getLogger('system');
app.use(Log4js.connectLogger(log4js));
const logger = require('./logger');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));  // JSONの送信を許可
app.use(bodyParser.json());                        // JSONのパースを楽に（受信時）

//pulic フォルダを公開する
//app.use(express.static('public'));

//TODO
//早めに200を返す
//署名検証 
//エスケープシーケンス
//画像認識
//スタンプ

//test
app.get('/', function(req, res) {
    //console.log('kani::: '+JSON.stringify(req.body));
    //console.log(__dirname+'index.html');
    //res.sendFile(__dirname+'index.html');
    res.send('Hello World!');
});

app.get('/logs', function(req, res) {
    console.log('kani::: logs.');
    //res.redirect(302, './log.html');
    res.send('Hello World!');
});

app.post('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    res.send('Hello World!');
});

app.get('/callback', function(req, res) {
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
            let to = json['result'][0]['content']['from'];
            to_array.push(to);
            
            //TODO 友達登録（名前登録）機能
            //メッセージのcontent内容
            //位置情報も受け取れるっぽい
            //redis search & register

            //受信メッセージ
            var text = json['result'][0]['content']['text'];

            logger.log(logger.type.INFO, 'Line=>('+to+'):'+text);

            //redis接続
            client.on('error', function (err) {
                console.log('Error ' + err);
            });

            //関数呼び出し用引数
            const args = {
                to_array: to_array,
                text: text,
                json: json,
                client: client,
                callback: callback
            };

            //parse talktype!
            parser(args);
        },
        
        //message dispatcher
        function(args2, callback){
            messanger(args2, callback);
        }
    ],

    // LINE BOT
    function(err, to_array, message) {
        if(err){
            res.send(err);
            return;
        }
        Linebot(to_array, message);
        res.send(message);
    });
    
});


app.listen(app.get('port'), function() {
    console.log('Node app is running');
});
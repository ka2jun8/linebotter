//ぐるなび＋Line bot

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var async = require('async');
var parser = require('./parser');
var Grnavi = require('./grnavi');
var Hpepper = require('./hotpepper');
var Linebot = require('./linebot');
var redis = require("redis");
var client = redis.createClient();
const Util = require('./util');
    
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));  // JSONの送信を許可
app.use(bodyParser.json());                        // JSONのパースを楽に（受信時）
app.use(express.static('public'));

//test
app.get('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    console.log(__dirname+'index.html');
    res.sendFile(__dirname+'index.html');
});

app.get('/logs', function(req, res) {
    console.log('kani::: logs.');
    res.redirect(302, './log.html');
});

app.post('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    res.send('Hello World!');
});

app.get('/callback', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    res.send('Hello World!');
});

app.post('/callback', function(req, res){
    console.log('kani::: '+JSON.stringify(req.body));

    async.waterfall([
        // ぐるなびAPI
        function(callback) {
            var json = req.body;
            //console.log('kani::: ' + JSON.stringify(json));
            
            // 送信相手の設定（配列）
            var to_array = [];
            let to = json['result'][0]['content']['from'];
            to_array.push(to);
            console.log('Line to:'+to);
            
            //受信メッセージ
            var text = json['result'][0]['content']['text'];

            client.on('error', function (err) {
                console.log('Error ' + err);
            });

            parser(text,json,client,to_array,callback);
        },
        
        function(err, words, text, json, type, client, to_array, callback){
            if(err){
                res.send(err);
                return;
            }
            
            if(type===Util.TALKTYPE.OTHER){
                let message = [
                    // テキスト
                    {
                        'contentType': 1,
                        'text': 'かにかに〜♪'
                    }
                ];
                Linebot(err, to_array, message);
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
                Linebot(err, to_array, message);
            }
            else if(type===Util.TALKTYPE.GROUMET_SEARCH){
                /*
                // 受信テキスト
                var search_word_array = text.split('\n');
                var search_place = search_word_array[0];

                //検索キーワード
                var gnavi_keyword = '';
                if (search_word_array.length == 2) {
                    var keyword_array = search_word_array[1].split('、');
                    gnavi_keyword = keyword_array.join();
                }
                console.log('kani::: place=' + search_place + '/key=' + gnavi_keyword);
                */

                client.get('groumet_key', (err, reply)=> {
                    let place = reply;
                    //ぐるなび検索
                    //Grnavi(place, keyword, json, to_array, callback);
                    //ホットペッパー検索
                    Hpepper(place, keyword, json, to_array, callback);

                });

            }
            
        }
    ],

    // LINE BOT
    function(err, to_array, message) {
        if(err){
            res.send(err);
            return;
        }
        Linebot(err, to_array, message);
        res.send(message);
    });
    
});


app.listen(app.get('port'), function() {
    console.log('Node app is running');
});
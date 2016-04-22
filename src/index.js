//ぐるなび＋Line bot

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var async = require('async');
var Grnavi = require('./grnavi');
var Linebot = require('./linebot');

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));  // JSONの送信を許可
app.use(bodyParser.json());                        // JSONのパースを楽に（受信時）
app.use(express.static('public'));

//test
app.get('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));
    //res.send('Hello World!');
    console.log(__dirname+'index.html');
    //path.join(__dirname, 'index.html');
    res.sendFile(__dirname+'index.html');
});

app.get('/logs', function(req, res) {
    console.log('kani::: logs.');
    res.redirect(302, './log.html');
});

app.post('/', function(req, res) {
    console.log('kani::: '+JSON.stringify(req.body));

    async.waterfall([
        // ぐるなびAPI
        function(callback) {
            var json = req.body;
            console.log('kani::: ' + JSON.stringify(json));
            
            var text = json['result'][0]['content']['text'];

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

            //ぐるなび検索
            Grnavi(search_place, gnavi_keyword, json, callback);
        }
    ],

    // LINE BOT
    function(err, json, search_result) {
        Linebot(err, json, search_result);
        res.send(search_result);
    });
    
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
            
            var text = json['result'][0]['content']['text'];

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

            //ぐるなび検索
            Grnavi(search_place, gnavi_keyword, json, callback);
        }
    ],

    // LINE BOT
    function(err, json, search_result) {
        Linebot(err, json, search_result);
        res.send(search_result);
    });
    
});


app.listen(app.get('port'), function() {
    console.log('Node app is running');
});
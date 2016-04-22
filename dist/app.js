/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(__dirname) {//ぐるなび＋Line bot

	var express = __webpack_require__(1);
	var app = express();
	var bodyParser = __webpack_require__(2);
	var async = __webpack_require__(3);
	var Grnavi = __webpack_require__(4);
	var Linebot = __webpack_require__(6);

	var http = __webpack_require__(7).Server(app);
	var io = __webpack_require__(8)(http);

	app.set('port', process.env.PORT || 5000);
	app.use(bodyParser.urlencoded({ extended: true })); // JSONの送信を許可
	app.use(bodyParser.json()); // JSONのパースを楽に（受信時）
	app.use(express.static('public'));

	//test
	app.get('/', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));
	    //res.send('Hello World!');
	    console.log(__dirname + 'index.html');
	    res.sendFile(__dirname + 'index.html');
	});

	//socket.io
	io.on('connection', function (socket) {
	    socket.on('chat message', function (msg) {
	        console.log('message: ' + msg);
	    });
	});

	app.get('/logs', function (req, res) {
	    console.log('kani::: logs.');
	    res.redirect(302, './log.html');
	});

	app.post('/', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));

	    async.waterfall([
	    // ぐるなびAPI
	    function (callback) {
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
	    }],

	    // LINE BOT
	    function (err, json, search_result) {
	        Linebot(err, json, search_result);
	        res.send(search_result);
	    });
	});

	app.get('/callback', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));
	    res.send('Hello World!');
	});

	app.post('/callback', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));

	    async.waterfall([
	    // ぐるなびAPI
	    function (callback) {
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
	    }],

	    // LINE BOT
	    function (err, json, search_result) {
	        Linebot(err, json, search_result);
	        res.send(search_result);
	    });
	});

	app.listen(app.get('port'), function () {
	    console.log('Node app is running');
	});
	/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("body-parser");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("async");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var request = __webpack_require__(5);

	function grnavi(place, keyword, json, callback) {
	    // ぐるなびAPI レストラン検索API
	    var gnavi_url = 'http://api.gnavi.co.jp/RestSearchAPI/20150630/';

	    console.log('gnavi = ' + process.env.GNAVI_KEY);

	    // ぐるなび リクエストパラメータの設定
	    var gnavi_query = {
	        'keyid': process.env.GNAVI_KEY,
	        'format': 'json',
	        'address': place,
	        'hit_per_page': 1,
	        'freeword': keyword,
	        'freeword_condition': 2
	    };
	    var gnavi_options = {
	        url: gnavi_url,
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: gnavi_query,
	        json: true
	    };

	    // 検索結果をオブジェクト化
	    var search_result = {};

	    //console.log('proxy='+process.env.PROXY);

	    request.get(gnavi_options, function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            if ('error' in body) {
	                console.log('検索エラー' + JSON.stringify(body));
	                return;
	            }

	            // 店名
	            if ('name' in body.rest) {
	                search_result['name'] = body.rest.name;
	            }
	            // 画像
	            if ('image_url' in body.rest) {
	                search_result['shop_image1'] = body.rest.image_url.shop_image1;
	            }
	            // 住所
	            if ('address' in body.rest) {
	                search_result['address'] = body.rest.address;
	            }
	            // 緯度
	            if ('latitude' in body.rest) {
	                search_result['latitude'] = body.rest.latitude;
	            }
	            // 軽度
	            if ('longitude' in body.rest) {
	                search_result['longitude'] = body.rest.longitude;
	            }
	            // 営業時間
	            if ('opentime' in body.rest) {
	                search_result['opentime'] = body.rest.opentime;
	            }

	            console.log('kani::: ' + JSON.stringify(search_result));

	            callback(null, json, search_result);
	        } else {
	            console.log('error: ' + response.statusCode);
	        }
	    });
	}

	module.exports = grnavi;

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("request");

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var request = __webpack_require__(5);

	function linebot(err, json, search_result) {

	    if (err) {
	        return;
	    }

	    //ヘッダーを定義
	    var headers = {
	        'Content-Type': 'application/json; charset=UTF-8',
	        'X-Line-ChannelID': process.env.LINE_CHANNELID,
	        'X-Line-ChannelSecret': process.env.LINE_SECRET,
	        'X-Line-Trusted-User-With-ACL': process.env.LINE_MID
	    };

	    // 送信相手の設定（配列）
	    var to_array = [];
	    to_array.push(json['result'][0]['content']['from']);

	    // 送信データ作成
	    var data = {
	        'to': to_array,
	        'toChannel': 1383378250, //固定
	        'eventType': '140177271400161403', //固定
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
	                'contentType': 7,
	                'text': search_result['name'],
	                'location': {
	                    'title': search_result['address'],
	                    'latitude': Number(search_result['latitude']),
	                    'longitude': Number(search_result['longitude'])
	                }
	            }]
	        }
	    };

	    console.log('kani::: data= ' + JSON.stringify(data));
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
	            console.log('error: ' + JSON.stringify(response));
	        }
	    });
	}

	module.exports = linebot;

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = require("socket.io");

/***/ }
/******/ ]);
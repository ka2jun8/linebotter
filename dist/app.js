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

	'use strict';

	//ぐるなび＋Line bot

	var express = __webpack_require__(1);
	var app = express();
	var bodyParser = __webpack_require__(2);
	var async = __webpack_require__(3);
	var parser = __webpack_require__(4);
	//var Grnavi = require('./grnavi');
	//var Hpepper = require('./hotpepper');
	var Linebot = __webpack_require__(11);
	var redis = __webpack_require__(7);
	var client = redis.createClient();
	//const Util = require('./util');
	var messanger = __webpack_require__(12);
	var Log4js = __webpack_require__(10);
	Log4js.configure('log-config.json');
	var log4js = Log4js.getLogger('system');
	app.use(Log4js.connectLogger(log4js));
	var logger = __webpack_require__(9);

	app.set('port', process.env.PORT || 5000);
	app.use(bodyParser.urlencoded({ extended: true })); // JSONの送信を許可
	app.use(bodyParser.json()); // JSONのパースを楽に（受信時）

	//pulic フォルダを公開する
	//app.use(express.static('public'));

	//TODO
	//エスケープシーケンス

	//test
	app.get('/', function (req, res) {
	    //console.log('kani::: '+JSON.stringify(req.body));
	    //console.log(__dirname+'index.html');
	    //res.sendFile(__dirname+'index.html');
	    res.send('Hello World!');
	});

	app.get('/logs', function (req, res) {
	    console.log('kani::: logs.');
	    //res.redirect(302, './log.html');
	    res.send('Hello World!');
	});

	app.post('/', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));
	    res.send('Hello World!');
	});

	app.get('/callback', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));
	    res.send('Hello World!');
	});

	app.post('/callback', function (req, res) {
	    //console.log('kani::: '+JSON.stringify(req.body));
	    async.waterfall([
	    // ぐるなびAPI
	    function (callback) {
	        var json = req.body;

	        // 送信相手の設定（配列）
	        var to_array = [];
	        var to = json['result'][0]['content']['from'];
	        to_array.push(to);

	        //受信メッセージ
	        var text = json['result'][0]['content']['text'];

	        logger.log(logger.type.INFO, 'Line=>(' + to + '):' + text);

	        //redis接続
	        client.on('error', function (err) {
	            console.log('Error ' + err);
	        });

	        //関数呼び出し用引数
	        var args = {
	            text: text,
	            json: json,
	            client: client,
	            to_array: to_array,
	            callback: callback
	        };

	        //parse talktype!
	        parser(args);
	    },

	    //message dispatcher
	    function (args2, callback) {
	        messanger(args2, callback);
	    }],

	    // LINE BOT
	    function (err, to_array, message) {
	        if (err) {
	            res.send(err);
	            return;
	        }
	        Linebot(to_array, message);
	        res.send(message);
	    });
	});

	app.listen(app.get('port'), function () {
	    console.log('Node app is running');
	});

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

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var request = __webpack_require__(5);
	var xml2json = __webpack_require__(6);
	var redis = __webpack_require__(7);
	var Util = __webpack_require__(8);
	var logger = __webpack_require__(9);

	//形態素解析的な。会話を理解したい
	function parser(args) {

	    //yahoo 形態素解析web api
	    var url = 'http://jlp.yahooapis.jp/MAService/V1/parse';
	    logger.log(logger.type.INFO, 'yahooid: ' + process.env.YAPPID);

	    // リクエストパラメータの設定
	    var query = {
	        'appid': process.env.YAPPID,
	        'sentence': args.text
	    };
	    var options = {
	        url: url,
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: query,
	        json: true
	    };

	    request.get(options, function (error, response /*, body*/) {
	        var xml = response.body;
	        var _json = xml2json.toJson(xml);
	        var obj = JSON.parse(_json);
	        var word_list = obj.ResultSet.ma_result.word_list;

	        var words = [];
	        if (!Array.isArray(word_list.word)) {
	            words.push(word_list.word);
	        } else {
	            words = word_list.word;
	        }
	        //console.log(words);

	        //トークタイプの判定
	        var type = Util.TALKTYPE.OTHER;
	        args.client.get('talktype', function (err, reply) {
	            //一つ前のトークタイプ
	            logger.log(logger.type.INFO, 'previous talktype ' + reply);
	            //console.log('reply='+reply);

	            if (reply) {
	                type = reply;
	            }
	            if (type == Util.TALKTYPE.GROUMET) {
	                //2
	                //console.log('type groumet');
	                type = Util.TALKTYPE.GROUMET_SEARCH; //2-1

	                words.map(function (word) {
	                    if (word.pos === '名詞') {
	                        args.client.set('groumet_key', type, redis.print);
	                    }
	                });
	            } else if (type == Util.TALKTYPE.OTHER) {
	                //0
	                //console.log('type other');
	                words.map(function (word) {
	                    logger.log(logger.type.INFO, type + ':' + word);
	                    if (word.reading === 'ごはん') {
	                        type = Util.TALKTYPE.GROUMET;
	                    } else if (word.reading.indexOf('おはよう') != -1) {
	                        type = Util.TALKTYPE.OHA;
	                    } else if (word.reading.indexOf('こんにち') != -1) {
	                        type = Util.TALKTYPE.KONNICHIWA;
	                    } else if (word.reading.indexOf('こんばん') != -1) {
	                        type = Util.TALKTYPE.KONBANWA;
	                    } else {
	                        type = Util.TALKTYPE.OTHER;
	                    }
	                });
	            } else if (type == Util.TALKTYPE.ERROR) {
	                //-1
	                console.log('AFTER ERROR: {' + (typeof type === 'undefined' ? 'undefined' : _typeof(type)) + '}' + type);
	                type = Util.TALKTYPE.OTHER;
	            } else {
	                console.log('ERROR: {' + (typeof type === 'undefined' ? 'undefined' : _typeof(type)) + '}' + type);
	                type = Util.TALKTYPE.ERROR;
	            }

	            //TODO clientID.number : text に?
	            //場所、営業時間をkeyにして保管?
	            args.client.set('talktype', type, redis.print);
	            logger.log(logger.type.INFO, 'set talktype ' + type);

	            var _args = {
	                type: type,
	                words: words,
	                text: args.text,
	                json: args.json,
	                client: args.client,
	                to_array: args.to_array
	            };

	            args.callback(null, _args);
	        });
	    });
	}

	module.exports = parser;

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("request");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("xml2json");

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("redis");

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	//TODO typeとsubtypeを用意しよう
	var Util = {
	    TALKTYPE: {
	        OTHER: '0',
	        OHA: '1-1',
	        KONNICHIWA: '1-2',
	        KONBANWA: '1-3',
	        GROUMET: '2',
	        GROUMET_SEARCH: '2-1',
	        ERROR: '-1'
	    }
	};

	module.exports = Util;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//TODO
	//ログはlog4jsを使う
	//ログに日付つける
	//./logs.htmlでログfrontailに飛ばす-> nginx
	//ベーシック認証はつける

	var Log4js = __webpack_require__(10);
	// 設定ファイル（log-config.json）の読み込み
	Log4js.configure('log-config.json');
	// ログ出力
	var systemLogger = Log4js.getLogger('system');

	var prefix = 'kanilog:::';
	var logger = {
	    //TODO File 出力
	    //  ERROR, WARNING, ... 設定によって表示をかえる
	    type: {
	        ERROR: 0,
	        WARNING: 1,
	        INFO: 2
	    },
	    log: function log(type, text) {
	        systemLogger.info(prefix + text);
	    }
	};

	module.exports = logger;

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = require("log4js");

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(5);
	var logger = __webpack_require__(9);

	function linebot(to_array, message) {
	    //ヘッダーを定義
	    var headers = {
	        'Content-Type': 'application/json; charset=UTF-8',
	        'X-Line-ChannelID': process.env.LINE_CHANNELID,
	        'X-Line-ChannelSecret': process.env.LINE_SECRET,
	        'X-Line-Trusted-User-With-ACL': process.env.LINE_MID
	    };

	    // 送信データ作成
	    var data = {
	        'to': to_array,
	        'toChannel': 1383378250, //固定
	        'eventType': '140177271400161403', //固定
	        'content': {
	            'messageNotified': 0,
	            'messages': message
	        }
	    };

	    logger.log(logger.type.INFO, 'hpepper: ' + process.env.LINE_CHANNELID + '\n' + 'kani::: data= ' + JSON.stringify(data));

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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//const Grnavi = require('./grnavi');
	var Hpepper = __webpack_require__(13);
	var Util = __webpack_require__(8);
	var logger = __webpack_require__(9);
	var redis = __webpack_require__(7);

	function messanger(args, callback) {
	    var type = args.type;
	    if (type === Util.TALKTYPE.OTHER) {
	        var message = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'かにかに〜♪'
	        }];
	        callback(null, args.to_array, message);
	    } else if (type === Util.TALKTYPE.ERROR) {
	        var _message = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'ちょっと理解不能…'
	        }];
	        callback(null, args.to_array, _message);
	    } else if (type === Util.TALKTYPE.OHA) {
	        var _message2 = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'おはかに♪'
	        }];
	        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
	        callback(null, args.to_array, _message2);
	    } else if (type === Util.TALKTYPE.KONNICHIWA) {
	        var _message3 = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'こんにちわかに♪'
	        }];
	        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
	        callback(null, args.to_array, _message3);
	    } else if (type === Util.TALKTYPE.KONBANWA) {
	        var _message4 = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'こんばんわかに♪'
	        }];
	        args.client.set('talktype', Util.TALKTYPE.OTHER, redis.print);
	        callback(null, args.to_array, _message4);
	    } else if (type === Util.TALKTYPE.GROUMET) {
	        var _message5 = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'どんなところがいい？'
	        }
	        //TODO 場所、キーワード///
	        ];
	        callback(null, args.to_array, _message5);
	    } else if (type === Util.TALKTYPE.GROUMET_SEARCH) {
	        args.client.get('groumet_key', function (err, reply) {
	            var place = reply;

	            logger.log(logger.type.INFO, 'search groumet:[key]:' + reply);

	            //ぐるなび検索
	            //Grnavi(place, keyword, json, to_array, callback);
	            //ホットペッパー検索
	            Hpepper(place, '', args.json, args.to_array, callback);
	        });
	    }
	}

	module.exports = messanger;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(5);
	var logger = __webpack_require__(9);

	//hotpepper apiつーかう
	function hotpepper(place, keyword, json, to_array, callback) {

	    // Hotpepper レストラン検索API
	    var url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
	    logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

	    // ぐるなび リクエストパラメータの設定
	    var query = {
	        'key': process.env.HP_KEY,
	        'format': 'json',
	        'keyword': place + ' ' + keyword
	    };
	    var options = {
	        url: url,
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: query,
	        json: true
	    };

	    // 検索結果をオブジェクト化
	    var result = {};

	    request.get(options, function (error, response, body) {
	        if (!error && response.statusCode == 200) {
	            if ('error' in body) {
	                var errms = [{
	                    'contentType': 1,
	                    'text': '見つからなかったよー'
	                }];
	                callback(null, to_array, errms);
	                console.log('検索エラー' + JSON.stringify(body));
	                return;
	            }
	        }

	        var res = response.body;
	        var shops = res.results.shop;

	        result = {
	            name: shops[0].name,
	            shop_image1: shops[0].photo.mobile.l,
	            address: shops[0].address,
	            latitude: shops[0].lat,
	            longitude: shops[0].lng,
	            opentime: shops[0].open
	        };

	        var message = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': 'こちらはいかがですか？\n【お店】' + result['name'] + '\n【営業時間】' + result['opentime']
	        },
	        // 画像
	        {
	            'contentType': 2,
	            'originalContentUrl': result['shop_image1'],
	            'previewImageUrl': result['shop_image1']
	        },
	        // 位置情報
	        {
	            'contentType': 7,
	            'text': result['name'],
	            'location': {
	                'title': result['address'],
	                'latitude': Number(result['latitude']),
	                'longitude': Number(result['longitude'])
	            }
	        }];
	        callback(null, to_array, message);
	    });
	}

	module.exports = hotpepper;

/***/ }
/******/ ]);
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
	var cparser = __webpack_require__(4);
	var Linebot = __webpack_require__(12);
	var redis = __webpack_require__(8);
	var client = redis.createClient();
	//const Util = require('./util');
	var dispatcher = __webpack_require__(13);
	var Log4js = __webpack_require__(11);
	Log4js.configure('log-config.json');
	var log4js = Log4js.getLogger('system');
	app.use(Log4js.connectLogger(log4js));
	var logger = __webpack_require__(10);
	var util = __webpack_require__(9);

	app.set('port', process.env.PORT || 5000);
	app.use(bodyParser.urlencoded({ extended: true })); // JSONの送信を許可
	app.use(bodyParser.json()); // JSONのパースを楽に（受信時）

	//pulic フォルダを公開する
	//app.use(express.static('public'));

	//TODO
	//今何時？
	//並列処理＋エラー処理
	//署名検証
	//エスケープシーケンス
	//画像認識
	//スタンプ対応
	//雑談API
	//ここから〜〜までの行き方 //位置情報
	//あらーむ
	//健康
	//redis search & register
	//アラーム時間差で

	//test
	app.get('/', function (req, res) {
	    //console.log('kani::: '+JSON.stringify(req.body));
	    //res.sendFile(__dirname+'index.html');
	    res.send('Hello World!');
	});

	app.post('/', function (req, res) {
	    console.log('kani::: ' + JSON.stringify(req.body));
	    res.send('Hello World!');
	});

	//Linebot-callback
	app.post('/callback', function (req, res) {
	    //console.log('kani::: '+JSON.stringify(req.body));
	    async.waterfall([
	    //Receive line message
	    function (callback) {
	        var json = req.body;

	        // 送信相手の設定（配列）
	        var to_array = [];
	        var to = json['result'][0]['content']['from'];
	        to_array.push(to);

	        //TODO 友達登録（名前登録）機能

	        //受信メッセージ
	        var content = json.result[0].content;

	        logger.log(logger.type.INFO, 'INDEX: Line=>(' + to + '):' + JSON.stringify(content));

	        //redis接続
	        client.on('error', function (err) {
	            console.log('Error ' + err);
	        });

	        //関数呼び出し用引数
	        var args = {
	            to_array: to_array,
	            content: content,
	            client: client,
	            callback: callback
	        };

	        //さきに200返しておく
	        res.send('Receive [' + to + ']:' + JSON.stringify(content));

	        //content parse & set talktype
	        cparser(args);
	    },

	    //message dispatcher
	    function (args2, callback) {

	        dispatcher(args2, callback);
	    }],

	    // LINE BOT
	    function (err, to_array, message) {
	        if (err) {
	            logger.log(logger.type.ERROR, err);
	            var errm = util.message('なんかエラーがおきたみたい');
	            message = errm;
	        }
	        Linebot(to_array, message);
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

	var textParser = __webpack_require__(5);
	var logger = __webpack_require__(10);
	var redis = __webpack_require__(8);
	var util = __webpack_require__(9);

	function parseContent(args) {
	    //トークタイプの判定
	    var type = util.TALKTYPE.OTHER;

	    args.client.get('talktype', function (err, reply) {
	        //スタンプや位置情報、画像などを取り出し
	        var location = {};

	        //一つ前のトークタイプ
	        var previous = void 0;
	        if (reply) {
	            logger.log(logger.type.INFO, 'Parser: previous talktype ' + reply);
	            try {
	                previous = JSON.parse(reply);
	            } catch (e) {
	                previous = util.TALKTYPE.OTHER;
	            }
	        }

	        //TODO 本当はここでオートマトン->そのあとコンテンツ分岐か

	        //Contentによって分岐
	        if (args.content.contentType == 1) {
	            //textだよ
	            textParser(previous, args);
	            return;
	        } else if (args.content.contentType == 2) {
	            //imageだよ
	            //
	        } else if (args.content.contentType == 7) {
	                //locationだよ
	                location = args.content.location;
	                logger.log(logger.type.INFO, 'Parser:' + JSON.stringify(location));
	            } else if (args.content.contentType == 8) {}
	            //stickerスタンプだよ
	            //


	            //引数オプション
	        var option = {
	            glocation: location //ぐるめロケーション
	        };

	        //Redis にtalktypeを保管
	        args.client.set('talktype', JSON.stringify(type), redis.print);
	        logger.log(logger.type.INFO, 'Parser: set talktype ' + JSON.stringify(type));

	        //引数設定
	        var _args = {
	            type: type,
	            option: option,
	            to_array: args.to_array,
	            client: args.client
	        };
	        //先頭nullで成功を示す
	        args.callback(null, _args);
	    });
	}

	module.exports = parseContent;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var xml2json = __webpack_require__(7);
	var redis = __webpack_require__(8);
	var Util = __webpack_require__(9);
	var logger = __webpack_require__(10);

	//TODO 〜時に〜して、というスケジューラ機能?

	//形態素解析的な。会話を理解したい
	function parseText(previous, args) {

	    //yahoo 形態素解析web api
	    var url = 'http://jlp.yahooapis.jp/MAService/V1/parse';
	    //logger.log(logger.type.INFO, 'yahooid: ' + process.env.YAPPID);

	    // リクエストパラメータの設定
	    var query = {
	        'appid': process.env.YAPPID,
	        'sentence': args.content.text
	    };
	    var options = {
	        url: url,
	        proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: query,
	        json: true
	    };

	    request.get(options, function (error, response /*, body*/) {
	        var xml = response.body;
	        var _json = xml2json.toJson(xml);
	        var obj = JSON.parse(_json);
	        var word_list = obj.ResultSet.ma_result.word_list.word;

	        var words = [];
	        words.push(word_list);
	        if (!Array.isArray(word_list)) {
	            words.push(word_list);
	        } else {
	            word_list.forEach(function (word) {
	                words.push(word);
	            });
	        }

	        //引数オプション       
	        var option = {
	            gkey: []
	        };

	        //トークタイプの判定
	        var type = previous; //前回のtype -> 一つ前によってオートマトン
	        try {
	            //set talktype
	            if (type.key == Util.TALKTYPE.OTHER.key) {
	                //0
	                words.map(function (word) {
	                    //logger.log(logger.type.INFO, type+':'+word);
	                    if (word.reading === 'ごはん') {
	                        type = Util.TALKTYPE.GROUMET;
	                    }
	                    /////GREETING//////
	                    else if (word.reading.indexOf('おはよう') != -1) {
	                            type = Util.TALKTYPE.GREETING.OHA;
	                        } else if (word.reading.indexOf('こんにち') != -1) {
	                            type = Util.TALKTYPE.GREETING.KONNICHIWA;
	                        } else if (word.reading.indexOf('こんばん') != -1) {
	                            type = Util.TALKTYPE.GREETING.KONBANWA;
	                        }
	                        ///////////////////
	                        else {
	                                type = Util.TALKTYPE.OTHER;
	                            }
	                    ///////////////////
	                });
	            }
	            ////////GROUMET////////
	            else if (type.key == Util.TALKTYPE.GROUMET.key) {
	                    //2
	                    type = Util.TALKTYPE.GROUMET.GROUMET_SEARCH; //2-1
	                    words.map(function (word) {
	                        if (word.pos === '名詞') {
	                            option.gkey.push(word.surface);
	                        }
	                    });
	                } else {
	                    type = Util.TALKTYPE.OTHER;
	                }
	            ////////////////////////
	        } catch (e) {
	            logger.log(logger.type.ERROR, 'ERROR: ' + JSON.stringify(type) + '/' + e);
	            type = Util.TALKTYPE.ERROR;
	        }

	        //Redis にtalktypeを保管
	        args.client.set('talktype', JSON.stringify(type), redis.print);
	        logger.log(logger.type.INFO, 'Parser: set talktype ' + JSON.stringify(type));

	        //引数設定
	        var _args = {
	            type: type,
	            text: args.content.text,
	            option: option,
	            to_array: args.to_array,
	            client: args.client
	        };

	        //先頭nullで成功を示す
	        args.callback(null, _args);
	    });
	}

	module.exports = parseText;

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("request");

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("xml2json");

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = require("redis");

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';

	var Util = {
	    //トークタイプ
	    TALKTYPE: {
	        OTHER: {
	            key: '0',
	            value: '*'
	        },
	        GREETING: {
	            key: '1',
	            OHA: {
	                key: '1-1',
	                value: 'おは'
	            },
	            KONNICHIWA: {
	                key: '1-2',
	                value: 'こんにち'
	            },
	            KONBANWA: {
	                key: '1-3',
	                value: 'こんばん'
	            }
	        },
	        GROUMET: {
	            key: '2',
	            value: 'ごはん',
	            GROUMET_SEARCH: {
	                key: '2-1',
	                value: '*'
	            }
	        },
	        ERROR: {
	            key: '-1',
	            value: '*'
	        }
	    },

	    //テキストセット
	    message: function message(text) {
	        var obj = [{
	            'contentType': 1,
	            'text': text
	        }];
	        return obj;
	    }
	};

	module.exports = Util;

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	//TODO
	//TODO File 出力
	//ログはlog4jsを使う
	//./logs.htmlでログfrontailに飛ばす-> nginx
	//ベーシック認証はつける

	var Log4js = __webpack_require__(11);
	// 設定ファイル（log-config.json）の読み込み
	Log4js.configure('log-config.json');
	// ログ出力
	// const errorLogger = Log4js.getLogger('error');
	// const warnLogger = Log4js.getLogger('warning');
	var systemLogger = Log4js.getLogger('system');

	var prefix = 'kanilog:::';
	var logger = {
	    type: {
	        ERROR: 0,
	        WARNING: 1,
	        INFO: 2
	    },
	    log: function log(t, text) {
	        if ((typeof text === 'undefined' ? 'undefined' : _typeof(text)) == 'object') {
	            text = JSON.stringify(text);
	        }
	        if (typeof t == 'string' && !text) {
	            systemLogger.info(prefix + text);
	        } else {
	            systemLogger.info(prefix + text);
	        }
	    }
	};

	module.exports = logger;

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = require("log4js");

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var logger = __webpack_require__(10);

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

	    //logger.log(logger.type.INFO, 'hpepper: '
	    //            + process.env.LINE_CHANNELID+'\n'
	    //            +'kani::: data= '+ JSON.stringify(data));
	    logger.log(logger.type.INFO, JSON.stringify(data));

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
	            logger.log(logger.type.INFO, body);
	        } else {
	            logger.log(logger.type.INFO, 'error: ' + JSON.stringify(response));
	        }
	    });
	}
	module.exports = linebot;

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//const Grnavi = require('./createMessage/grnaviMessage');
	var Hpepper = __webpack_require__(14);
	var freetalk = __webpack_require__(15);
	var plain = __webpack_require__(16);
	var util = __webpack_require__(9);
	var logger = __webpack_require__(10);
	var redis = __webpack_require__(8);

	//メッセージ-dispatcher
	function messanger(args, callback) {
	    var type = args.type;

	    try {
	        logger.log(logger.type.INFO, 'messanger => ' + 'type-key:' + type.key);

	        if (type.key === util.TALKTYPE.OTHER.key) {
	            //callback(null, args.to_array, util.message('かにかに〜♪'));
	            freetalk(args.content, args.to_array, callback);
	            return;
	        } else if (type.key === util.TALKTYPE.GROUMET.GROUMET_SEARCH.key) {
	            args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);

	            logger.log(logger.type.INFO, JSON.stringify(args.option));

	            //ぐるなび検索
	            //Grnavi(place, keyword, json, to_array, callback);

	            //ホットペッパー検索
	            Hpepper(args.option, args.to_array, callback);
	            return;
	        } else if (type.key === util.TALKTYPE.ERROR.key) {
	            plain(util.message('ちょっと理解不能…'), args, callback);
	        }
	        /////GREETING//////
	        else if (type.key === util.TALKTYPE.GREETING.OHA.key) {
	                plain(util.message('おはかに♪'), args, callback);
	            } else if (type.key === util.TALKTYPE.GREETING.KONNICHIWA.key) {
	                plain(util.message('こんにちわかに♪'), args, callback);
	            } else if (type.key === util.TALKTYPE.GREETING.KONBANWA.key) {
	                plain(util.message('こんばんわかに♪'), args, callback);
	            }
	            //////GROUMET///////
	            else if (type.key === util.TALKTYPE.GROUMET.key) {
	                    callback(null, args.to_array, util.message('どんなところがいい？'));
	                } else {
	                    //ERROR
	                    callback('unknown error');
	                }
	    } catch (err) {
	        //ERROR
	        callback(err);
	    }
	}

	module.exports = messanger;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var logger = __webpack_require__(10);
	var util = __webpack_require__(9);

	//hotpepper apiつーかう
	function hotpepperMessage(option, to_array, callback) {

	    // Hotpepper レストラン検索API
	    var url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
	    //logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

	    var keys = option.gkey;
	    var keyword = '';
	    var location = option.location;

	    // HotPepper リクエストパラメータの設定
	    var query = {
	        'key': process.env.HP_KEY,
	        'format': 'json'
	    };

	    if (typeof keys !== 'undefined') {
	        logger.log(logger.type.INFO, 'hMessage: keywords ' + keys);

	        keys.map(function (key) {
	            keyword += key + ' ';
	        });

	        query.keyword = keyword;
	    } else if (typeof location !== 'undefined') {
	        query.lat = location.latitude;
	        query.lng = location.longitude;
	    }

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
	        try {

	            if (!error && response.statusCode == 200) {
	                if ('error' in body) {
	                    logger.log(logger.type.ERROR, 'hMessage: 検索エラー' + JSON.stringify(body));
	                    var errms = util.message('見つからないかに…');
	                    callback(null, to_array, errms);
	                    return;
	                }
	            }

	            var res = response.body;
	            var shops = res.results.shop;

	            var message = [];

	            if (shops) {

	                result = {
	                    name: shops[0].name,
	                    shop_image1: shops[0].photo.mobile.l,
	                    address: shops[0].address,
	                    latitude: shops[0].lat,
	                    longitude: shops[0].lng,
	                    opentime: shops[0].open
	                };

	                message = [
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
	            } else {
	                message = util.message('見つからないかに…');
	            }

	            callback(null, to_array, message);
	        } catch (e) {
	            callback(e);
	        }
	    });
	}

	module.exports = hotpepperMessage;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var logger = __webpack_require__(10);
	var util = __webpack_require__(9);

	//雑談api
	function freetalkMessage(args, to_array, callback) {

	    // DOCOMO雑談api
	    var url = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue?APIKEY=' + process.env.DOCOMOKEY;
	    //logger.log(logger.type.INFO, 'freetalk docomo: ' + process.env.DOCOMOKEY);

	    console.log('Message: args.text' + args.text);

	    // HotPepper リクエストパラメータの設定
	    var query = {
	        'utt': args.text
	        /*
	        "context":"10001",
	        "user":"99999",
	        "nickname":"光",
	        "nickname_y":"ヒカリ",
	        "sex":"女",
	        "bloodtype":"B",
	        "birthdateY":"1997",
	        "birthdateM":"5",
	        "birthdateD":"30",
	        "age":"16",
	        "constellations":"双子座",
	        "place":"東京",
	        "mode":"dialog",
	        "t":"20"
	        */
	    };

	    var options = {
	        url: url,
	        proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: query,
	        json: true
	    };

	    request.post(options, function (error, response, body) {
	        try {

	            if (!error && response.statusCode == 200) {
	                if ('error' in body) {
	                    logger.log(logger.type.ERROR, 'Message: 検索エラー' + JSON.stringify(body));
	                    var errms = util.message('かにかに〜♪');
	                    callback(null, to_array, errms);
	                    return;
	                }
	            }

	            var res = response.body;
	            var utt = res.results.utt;
	            var message = util.message(utt);
	            callback(null, to_array, message);
	        } catch (e) {
	            callback(e);
	        }
	    });
	}

	module.exports = freetalkMessage;

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var util = __webpack_require__(9);
	//const logger = require('./logger');
	var redis = __webpack_require__(8);

	function plainTextMessage(text, args, callback) {
	    args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	    callback(null, args.to_array, text);
	}

	module.exports = plainTextMessage;

/***/ }
/******/ ]);
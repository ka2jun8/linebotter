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
	//並列処理＋エラー処理
	//エスケープシーケンス
	//署名検証
	//画像認識 「これ何？」
	//スタンプ対応
	//傘必要な日は毎朝教えて欲しい
	//健康
	//みんな（友達）に発言する
	//アラーム時間差で
	//〜って何？ で辞書検索
	//〜の英語 で英辞書検索
	//ヘルプ

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
	    function (_args, callback) {

	        var args2 = {
	            type: _args.type,
	            text: _args.text,
	            option: _args.option,
	            to_array: _args.to_array,
	            client: _args.client
	        };

	        dispatcher(args2, callback);
	    }],

	    // LINE BOT
	    function (err, to_array, message) {
	        if (err) {
	            logger.log(logger.type.ERROR, err);
	            client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
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
	                if (previous == util.TALKTYPE.GROUMET) {
	                    type = util.TALKTYPE.GROUMET.GROUMET_SEARCH;
	                    location = args.content.location;
	                    logger.log(logger.type.INFO, 'Parser:' + JSON.stringify(location));
	                }
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
	        //先頭nullで成功を示す => dispatcher
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
	var util = __webpack_require__(9);
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
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: query,
	        json: true
	    };

	    request.get(options, function (error, response /*, body*/) {
	        var xml = response.body;
	        var _json = xml2json.toJson(xml);
	        var obj = JSON.parse(_json);
	        var word_list = obj.ResultSet.ma_result.word_list.word;

	        var text = args.content.text;
	        var words = [];
	        if (!Array.isArray(word_list)) {
	            words.push(word_list);
	        } else {
	            word_list.forEach(function (word) {
	                words.push(word);
	            });
	        }
	        logger.log(logger.type.INFO, 'parseText words: ' + JSON.stringify(words));

	        //引数オプション       
	        var option = {
	            gkey: '', //グルメ検索キーワード
	            time: '', //アラーム分後
	            goto: [], //行きたいところ,
	            wpoint: '' //天気を知りたい場所
	        };

	        //トークタイプの判定
	        var type = {};
	        //previous; //前回のtype -> 一つ前によってオートマトン
	        try {
	            //set talktype
	            if (previous.key == util.TALKTYPE.OTHER.key) {
	                //0
	                //logger.log(logger.type.INFO, type+':'+word);
	                /////GROUMET//////
	                if (util.checkText(util.TALKTYPE.GROUMET.value, words, text)) {
	                    type = util.TALKTYPE.GROUMET;
	                }
	                /////GREETING//////
	                else if (util.checkText(util.TALKTYPE.GREETING.OHA.value, words, text)) {
	                        type = util.TALKTYPE.GREETING.OHA;
	                    } else if (util.checkText(util.TALKTYPE.GREETING.KONNICHIWA.value, words, text)) {
	                        type = util.TALKTYPE.GREETING.KONNICHIWA;
	                    } else if (util.checkText(util.TALKTYPE.GREETING.KONBANWA.value, words, text)) {
	                        type = util.TALKTYPE.GREETING.KONBANWA;
	                    }
	                    ////////TALK//////////
	                    else if (util.checkText(util.TALKTYPE.TALK.KAWAII.value, words, text)) {
	                            type = util.TALKTYPE.TALK.KAWAII;
	                        } else if (util.checkText(util.TALKTYPE.TALK.ARIGATO.value, words, text)) {
	                            type = util.TALKTYPE.TALK.ARIGATO;
	                        } else if (util.checkText(util.TALKTYPE.TALK.LOVE.value, words, text)) {
	                            type = util.TALKTYPE.TALK.LOVE;
	                        } else if (util.checkText(util.TALKTYPE.TALK.WHATTIME.value, words, text)) {
	                            type = util.TALKTYPE.TALK.WHATTIME;
	                        }
	                        ////////アラーム////////////
	                        else if (util.checkText(util.TALKTYPE.ALARM.value, words, text)) {
	                                type = util.TALKTYPE.ALARM;
	                            }
	                            ////////天気////////////
	                            else if (util.checkText(util.TALKTYPE.WEATHER.value, words, text)) {
	                                    type = util.TALKTYPE.WEATHER;
	                                    option.wpoint = text;
	                                }
	                                /////////友達登録///////////
	                                else if (util.checkText(util.TALKTYPE.FRIEND.value, words, text)) {
	                                        type = util.TALKTYPE.FRIEND;
	                                    } else if (util.checkText(util.TALKTYPE.FRIEND.REGISTER.value, words, text)) {
	                                        type = util.TALKTYPE.FRIEND.REGISTER;
	                                    } else if (util.checkText(util.TALKTYPE.FRIEND.UNREGISTER.value, words, text)) {
	                                        type = util.TALKTYPE.FRIEND.UNREGISTER;
	                                    }
	                                    ////////マップ////////////
	                                    else if (util.checkText(util.TALKTYPE.GMAP.WHERE.value, words, text)) {
	                                            type = util.TALKTYPE.GMAP.WHERE;
	                                            option.maptarget = text;
	                                        } else if (util.checkText(util.TALKTYPE.GMAP.GOTO.value, words, text)) {
	                                            type = util.TALKTYPE.GMAP.GOTO;
	                                            option.goto = text;
	                                        }
	                                        ///////////////////////////
	                                        else {
	                                                type = util.TALKTYPE.OTHER;
	                                            }
	                ///////////////////
	            }

	            //////////////////////////////
	            ////////~ NEXT TERM ~/////////
	            //////////////////////////////

	            ////////GROUMET////////
	            else if (previous.key == util.TALKTYPE.GROUMET.key) {
	                    //2
	                    type = util.TALKTYPE.GROUMET.GROUMET_SEARCH; //2-1
	                    option.gkey = text;
	                } else if (previous.key == util.TALKTYPE.GROUMET.GROUMET_SEARCH.key || previous.key == util.TALKTYPE.GROUMET.RESULTS.key) {
	                    //2-1
	                    if (util.checkText(util.TALKTYPE.GROUMET.RESULTS.value, words, text)) {
	                        type = util.TALKTYPE.GROUMET.RESULTS; //2-2
	                    } else {
	                            type = util.TALKTYPE.OTHER;
	                        }
	                }
	                ////////ALARM////////
	                else if (previous.key == util.TALKTYPE.ALARM.key) {
	                        //
	                        type = util.TALKTYPE.OTHER; //
	                        words.forEach(function (word) {
	                            if (isFinite(word.surface)) {
	                                type = util.TALKTYPE.ALARM.ACCEPT;
	                                option.time = word.surface;
	                            }
	                        });
	                    }
	                    ////////FRIEND////////
	                    else if (previous.key == util.TALKTYPE.FRIEND.key) {
	                            //
	                            type = util.TALKTYPE.ERROR; //
	                            words.forEach(function (word) {
	                                if (word.reading.indexOf('する') != -1) {
	                                    type = util.TALKTYPE.FRIEND.REGISTER;
	                                }
	                            });
	                        }
	                        ////////////////////////
	                        else {
	                                type = util.TALKTYPE.OTHER;
	                            }
	            ////////////////////////
	        } catch (e) {
	            logger.log(logger.type.ERROR, 'ERROR: ' + JSON.stringify(type) + '/' + e);
	            type = util.TALKTYPE.ERROR;
	        }

	        //Redis にtalktypeを保管
	        args.client.set('talktype', JSON.stringify(type), redis.print);
	        logger.log(logger.type.INFO, 'Parser: set talktype ' + JSON.stringify(type));

	        //引数設定
	        var _args = {
	            type: type,
	            text: text,
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
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var logger = __webpack_require__(10);
	var Util = {
	    //トークタイプ
	    TALKTYPE: {
	        OTHER: {
	            key: '0',
	            value: ['*']
	        },
	        GREETING: {
	            key: '1',
	            OHA: {
	                key: '1-1',
	                value: ['おは']
	            },
	            KONNICHIWA: {
	                key: '1-2',
	                value: ['こんにち']
	            },
	            KONBANWA: {
	                key: '1-3',
	                value: ['こんばん']
	            }
	        },
	        GROUMET: {
	            key: '2',
	            value: ['ごはん', 'めし'],
	            GROUMET_SEARCH: {
	                key: '2-1',
	                value: ['.+']
	            },
	            RESULTS: {
	                key: '2-2',
	                value: ['他', 'ほか']
	            }
	        },
	        FRIEND: {
	            key: '3',
	            value: ['ともだち'],
	            REGISTER: {
	                key: '3-1',
	                value: ['友達登録']
	            },
	            UNREGISTER: {
	                key: '3-2',
	                value: ['友達解除']
	            }
	        },
	        ALARM: {
	            key: '4',
	            value: ['あらーむ'],
	            ACCEPT: {
	                key: '4-1',
	                value: ['\d']
	            }
	        },
	        GMAP: {
	            WHERE: {
	                key: '5-1',
	                value: ['ってどこ？']
	            },
	            GOTO: {
	                key: '5-2',
	                value: ['\^\.\+から\.\+まで\$']
	            }
	        },
	        WEATHER: {
	            key: '6',
	            value: ['雨', 'あめ', '天気', '降水確率']
	        },
	        TALK: {
	            KAWAII: {
	                key: '9-1',
	                value: ['かわいい？']
	            },
	            ARIGATO: {
	                key: '9-2',
	                value: ['ありがと']
	            },
	            LOVE: {
	                key: '9-3',
	                value: ['すき', 'あいしてる']
	            },
	            WHATTIME: {
	                key: '9-4',
	                value: ['いまなんじ', '今なんじ', '今何時']
	            }
	        },
	        ERROR: {
	            key: '-1',
	            value: '*'
	        }
	    },

	    //テキスト判定
	    checkText: function checkText(targets, words, text) {
	        var result = false;
	        targets.forEach(function (target) {
	            var reg = new RegExp(target);
	            if (text.match(reg)) {
	                console.log('regExp true');
	                result = true;
	            }
	            if (text.indexOf(target) != -1) {
	                result = true;
	            }
	            words.forEach(function (word) {
	                if (word.reading.indexOf(target) != -1) {
	                    result = true;
	                }
	            });
	        });
	        return result;
	    },

	    //テキストセット
	    message: function message(text) {
	        //logger.log(logger.type.INFO, 'create message *<- '+text);
	        var obj = [{
	            'contentType': 1,
	            'text': text
	        }];
	        return obj;
	    },
	    //テキスト+画像セット
	    textImage: function textImage(text, imageArray) {
	        //logger.log(logger.type.INFO, 'create message *<- '+text);
	        var obj = [{
	            'contentType': 1,
	            'text': text
	        },
	        // 画像
	        {
	            'contentType': 2,
	            'originalContentUrl': imageArray[0],
	            'previewImageUrl': imageArray[0]
	        }];
	        return obj;
	    },
	    //テキストセット
	    textImageLocation: function textImageLocation(text, imageArray, location) {
	        //logger.log(logger.type.INFO, 'create message *<- '+text);
	        var obj = [
	        // テキスト
	        {
	            'contentType': 1,
	            'text': text
	        },
	        // 画像
	        {
	            'contentType': 2,
	            'originalContentUrl': imageArray[0],
	            'previewImageUrl': imageArray[0]
	        },
	        // 位置情報
	        {
	            'contentType': 7,
	            'text': location.name,
	            'location': {
	                'title': location.title,
	                'latitude': location.lat,
	                'longitude': location.lng
	            }
	        }];
	        logger.log(logger.type.INFO, 'create message *<- ' + JSON.stringify(obj));
	        return obj;
	    },

	    //@param time 1:day,2:time
	    calcTime: function calcTime(time) {
	        //今日の日付データを変数hidukeに格納
	        var date = new Date();
	        //年・月・日・曜日を取得する
	        var year = date.getFullYear();
	        var month = date.getMonth() + 1;
	        var week = date.getDay();
	        var day = date.getDate();
	        var yobi = new Array('日', '月', '火', '水', '木', '金', '土');
	        var hour = date.getHours(); // 時
	        var min = date.getMinutes(); // 分
	        var sec = date.getSeconds(); // 秒
	        var ymd = year + '年' + month + '月' + day + '日 ' + yobi[week] + '曜日';
	        var hms = hour + '時' + min + '分' + sec + '秒';
	        var ret = void 0;
	        if (time === 0) {
	            ret = {
	                year: year,
	                month: month,
	                day: day,
	                hour: hour,
	                min: min,
	                sec: sec
	            };
	        } else if (time === 1) {
	            ret = ymd;
	        } else if (time === 2) {
	            ret = hms;
	        } else {
	            ret = ymd + ' ' + hms;
	        }
	        return ret;
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
	            logger.log(logger.type.INFO, 'Linebotter: ' + JSON.stringify(body));
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
	var mapsearch = __webpack_require__(17);
	var transit = __webpack_require__(19);
	var weather = __webpack_require__(20);
	var util = __webpack_require__(9);
	var logger = __webpack_require__(10);
	var redis = __webpack_require__(8);
	var alarmMessage = __webpack_require__(21);

	//メッセージ-dispatcher
	function dispatcher(args, callback) {
	    var type = args.type;

	    try {
	        logger.log(logger.type.INFO, 'dispatcher => ' + 'type-key:' + type.key);

	        if (type.key === util.TALKTYPE.OTHER.key) {
	            //callback(null, args.to_array, util.message('かにかに〜♪'));
	            freetalk(args, args.to_array, callback);
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
	            /////////友達登録////////////
	            else if (type.key === util.TALKTYPE.FRIEND.key) {
	                    args.next = util.TALKTYPE.FRIEND;
	                    plain(util.message('友達登録するかに？'), args, callback);
	                } else if (type.key === util.TALKTYPE.FRIEND.REGISTER.key) {
	                    args.client.set('friend.' + args.to_array[0], 'true', redis.print);
	                    plain(util.message('友達登録したかに〜^^'), args, callback);
	                } else if (type.key === util.TALKTYPE.FRIEND.UNREGISTER.key) {
	                    args.client.set('friend.' + args.to_array[0], 'false', redis.print);
	                    plain(util.message('友達解除したかに〜涙'), args, callback);
	                }
	                //////////アラーム////////////
	                else if (type.key === util.TALKTYPE.ALARM.key) {
	                        args.next = util.TALKTYPE.ALARM;
	                        plain(util.message('何分後に通知してほしいかに？'), args, callback);
	                    } else if (type.key === util.TALKTYPE.ALARM.ACCEPT.key) {
	                        alarmMessage(args);
	                        plain(util.message('覚えてたら通知するかに！笑   ...あ、もう忘れたかに'), args, callback);
	                    }
	                    //////GROUMET///////
	                    else if (type.key === util.TALKTYPE.GROUMET.key) {
	                            args.next = util.TALKTYPE.GROUMET;
	                            plain(util.message('どんなところがいいかに？\n※スペースごとキーワードかに！'), args, callback);
	                        } else if (type.key === util.TALKTYPE.GROUMET.GROUMET_SEARCH.key) {
	                            //args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	                            //logger.log(logger.type.INFO, JSON.stringify(args.option));
	                            //ぐるなび検索
	                            //Grnavi(place, keyword, json, to_array, callback);
	                            //ホットペッパー検索
	                            Hpepper(args.option, args.client, args.to_array, callback);
	                        } else if (type.key === util.TALKTYPE.GROUMET.RESULTS.key) {
	                            args.option.other = 'true';
	                            Hpepper(args.option, args.client, args.to_array, callback);
	                        }
	                        //////////マップ////////////
	                        else if (type.key === util.TALKTYPE.GMAP.WHERE.key) {
	                                args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	                                if (typeof args.option.maptarget !== 'undefined') {
	                                    mapsearch({ to: args.option.maptarget }, args.to_array, callback);
	                                } else {
	                                    plain(util.message('行けると良いかにね'), args, callback);
	                                }
	                            } else if (type.key === util.TALKTYPE.GMAP.GOTO.key) {
	                                args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	                                if (typeof args.option.goto !== 'undefined') {
	                                    args.next = util.TALKTYPE.GMAP.GOTO;
	                                    transit({ to: args.option.goto }, args.to_array, callback);
	                                } else {
	                                    plain(util.message('行けると良いかにね'), args, callback);
	                                }
	                            }
	                            //////////天気////////////
	                            else if (type.key === util.TALKTYPE.WEATHER.key) {
	                                    args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	                                    weather(args.option.wpoint, args.to_array, callback);
	                                }
	                                ///////////TALK/////////////
	                                else if (type.key === util.TALKTYPE.TALK.KAWAII.key) {
	                                        plain(util.message('世界でいちばんかわいいよ、食べちゃいたいくらい。ぱくっ'), args, callback);
	                                    } else if (type.key === util.TALKTYPE.TALK.ARIGATO.key) {
	                                        plain(util.message('どういたかに'), args, callback);
	                                    } else if (type.key === util.TALKTYPE.TALK.LOVE.key) {
	                                        plain(util.message('あいしてるかに〜☻'), args, callback);
	                                    } else if (type.key === util.TALKTYPE.TALK.WHATTIME.key) {
	                                        var time = util.calcTime(2);
	                                        plain(util.message('いまアメリカは' + time + 'だよ！\n日本はもう９時間遅いかな？'), args, callback);
	                                    }
	                                    ////////////////////
	                                    else {
	                                            //ERROR
	                                            callback('unknown error');
	                                        }
	    } catch (err) {
	        //ERROR
	        callback(err);
	    }
	}

	module.exports = dispatcher;

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var logger = __webpack_require__(10);
	var util = __webpack_require__(9);
	var redis = __webpack_require__(8);

	//hotpepper apiつーかう
	function hotpepperMessage(option, client, to_array, callback) {
	    var message = [];

	    var setShop = function setShop(shop) {
	        return {
	            name: shop.name,
	            shop_image1: shop.photo.mobile.l,
	            address: shop.address,
	            latitude: shop.lat,
	            longitude: shop.lng,
	            opentime: shop.open,
	            url: shop.urls.pc
	        };
	    };
	    var setMessage = function setMessage(result) {
	        return {
	            text: 'こちらはいかがですかに？\n【お店】' + result.name + '\n【営業時間】' + result.opentime + '\n【URL】 ' + result.url,
	            imageArray: [result.shop_image1],
	            location: {
	                name: result.name,
	                title: result.address,
	                lat: Number(result.latitude),
	                lng: Number(result.longitude)
	            }
	        };
	    };

	    //"他には？" なのでshopsから返す
	    if (option.other) {
	        try {
	            client.get('shopIndex', function (err, index) {
	                index++;
	                client.get('shop' + index, function (err, shopJ) {
	                    var shop = JSON.parse(shopJ);

	                    if (shop) {
	                        client.set('shopIndex', index, redis.print);
	                        var result = setShop(shop);
	                        var mObj = setMessage(result);
	                        message = util.textImageLocation(mObj.text, mObj.imageArray, mObj.location);
	                    } else {
	                        message = util.message('見つからないかに…');
	                    }

	                    callback(null, to_array, message);
	                });
	            });
	        } catch (e) {
	            callback('エラーかに…' + e);
	        }
	    }

	    //初回検索時
	    else {
	            (function () {

	                // Hotpepper レストラン検索API
	                var url = 'http://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
	                //logger.log(logger.type.INFO, 'hpepper: ' + process.env.HP_KEY);

	                var keys = option.gkey;
	                var location = option.location;

	                // HotPepper リクエストパラメータの設定
	                var query = {
	                    'key': process.env.HP_KEY,
	                    'format': 'json'
	                };

	                if (typeof keys !== 'undefined') {
	                    logger.log(logger.type.INFO, 'hMessage: keywords ' + keys);
	                    query.keyword = keys;
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
	                        //console.log(JSON.stringify(body));
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

	                        if (shops) {
	                            result = setShop(shops[0]);
	                            var mObj = setMessage(result);
	                            message = util.textImageLocation(mObj.text, mObj.imageArray, mObj.location);
	                        } else {
	                            message = util.message('見つからないかに…');
	                        }

	                        callback(null, to_array, message);
	                    } catch (e) {
	                        callback(e);
	                    }
	                });
	            })();
	        }
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
	function freetalkMessage(content, to_array, callback) {
	    // DOCOMO雑談api
	    var url = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue?APIKEY=' + process.env.DOCOMOKEY;
	    //logger.log(logger.type.INFO, 'freetalk docomo: ' + process.env.DOCOMOKEY);

	    logger.log(logger.type.INFO, 'FreetalkMessage: args.text:' + content.text);

	    // HotPepper リクエストパラメータの設定
	    var query = {
	        'utt': content.text
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
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        body: query,
	        json: true
	    };

	    request.post(options, function (error, response /*, body*/) {
	        try {
	            var res = response.body;
	            var utt = res.utt;

	            //TODO 語尾をかえる？
	            var tmp = utt.substring(0, utt.length - 1);
	            var last = utt.substring(utt.length - 1);
	            if (last === ' ' || last === '笑') {
	                utt = tmp;
	            } else if (last === '。' || last === '！' || last === '？') {
	                utt = tmp + 'かに' + last;
	            } else {
	                utt = utt + 'かに';
	            }

	            var message = util.message(utt);

	            callback(null, to_array, message);
	        } catch (e) {
	            console.log(e);
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
	var logger = __webpack_require__(10);
	var redis = __webpack_require__(8);

	function plainTextMessage(text, args, callback) {
	    if (typeof args.next !== 'undefined') {
	        logger.log(logger.type.INFO, 'Parser: set talktype ' + JSON.stringify(args.next));
	        args.client.set('talktype', JSON.stringify(args.next), redis.print);
	    } else {
	        logger.log(logger.type.INFO, 'Parser: set talktype ' + JSON.stringify(util.TALKTYPE.OTHER));
	        args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
	    }
	    callback(null, args.to_array, text);
	}

	module.exports = plainTextMessage;

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//mapsearch
	//const request = require('request');
	var util = __webpack_require__(9);
	var logger = __webpack_require__(10);
	var mapSearch = __webpack_require__(18);

	function mapsearchMessage(option, to_array, callback) {
	    // Google MAP 検索 API
	    //let url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
	    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);
	    logger.log(logger.type.INFO, 'kani::: mapsearchMessage: ' + JSON.stringify(option));

	    var to = option.to;

	    var slice = to.indexOf('ってどこ');
	    to = to.substring(0, slice);

	    var message = [];

	    var mapMessage = function mapMessage(err, result) {
	        if (err || !result) {
	            callback('エラーかに...');
	        }

	        if (result) {
	            message = [
	            // テキスト
	            {
	                'contentType': 1,
	                'text': '見つけたよ！\n'
	            },
	            // 位置情報
	            {
	                'contentType': 7,
	                'text': result.name,
	                'location': {
	                    'title': result.name,
	                    'latitude': Number(result.lat),
	                    'longitude': Number(result.lng)
	                }
	            }];
	        } else {
	            message = util.message('見つからないかに…');
	        }

	        callback(null, to_array, message);
	    };

	    mapSearch(to, mapMessage);
	}

	module.exports = mapsearchMessage;

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//mapsearch
	var request = __webpack_require__(6);
	var logger = __webpack_require__(10);

	function mapSearch(place, _callback) {
	    // Google MAP 検索 API
	    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
	    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);
	    logger.log(logger.type.INFO, 'kani::: mapSearch: ' + place);

	    // Google map api リクエストパラメータの設定
	    var query = {
	        'key': process.env.GMAPKEY,
	        'query': place
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

	    request.get(options, function (error, response) {
	        try {
	            var res = response.body;
	            var results = res.results[0];

	            if (results.geometry !== 'undefined') {
	                var location = results.geometry.location;

	                result = {
	                    name: place,
	                    lat: location.lat,
	                    lng: location.lng
	                };
	            } else {
	                result = null;
	            }

	            logger.log(logger.type.INFO, 'mapSearch result: ' + JSON.stringify(result));
	            _callback(null, result);
	        } catch (e) {

	            _callback(e);
	        }
	    });
	}

	module.exports = mapSearch;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//transit
	var requestFrom = __webpack_require__(6);
	var requestTo = __webpack_require__(6);
	var util = __webpack_require__(9);
	var logger = __webpack_require__(10);

	function transitMessage(option, to_array, callback) {

	    // Google MAP 検索 API
	    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
	    var responseUrl = 'https://maps.google.com/maps?ie=UTF8';
	    //logger.log(logger.type.INFO, 'GMAPKEY: ' + process.env.GMAPKEY);

	    logger.log(logger.type.INFO, 'kani::: transitMessage: ' + JSON.stringify(option));

	    var goto = option.to;

	    var slice = goto.indexOf('から');
	    var from = goto.substring(0, slice);
	    var slice2 = goto.indexOf('まで');
	    var to = goto.substring(slice + 2, slice2);

	    // Google map api リクエストパラメータの設定
	    var queryFrom = {
	        'key': process.env.GMAPKEY,
	        'query': from
	    };

	    var queryTo = {
	        'key': process.env.GMAPKEY,
	        'query': to
	    };

	    var optionFrom = {
	        url: url,
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: queryFrom,
	        json: true
	    };
	    var optionTo = {
	        url: url,
	        //proxy: process.env.PROXY,
	        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	        qs: queryTo,
	        json: true
	    };

	    // 検索結果をオブジェクト化
	    var message = [];

	    requestFrom.get(optionFrom, function (error, responseFrom) {
	        try {
	            var resFrom = responseFrom.body.results[0];

	            if (resFrom.geometry !== 'undefined') {
	                var locFrom = resFrom.geometry.location;
	                responseUrl += '&saddr=' + locFrom.lat + ',' + locFrom.lng;

	                requestTo.get(optionTo, function (error, responseTo) {
	                    //console.log(JSON.stringify(responseTo));

	                    var resTo = responseTo.body.results[0];

	                    if (resTo.geometry !== 'undefined') {
	                        var locTo = resTo.geometry.location;
	                        responseUrl += '&daddr=' + locTo.lat + ',' + locTo.lng;

	                        message = [
	                        // テキスト
	                        {
	                            'contentType': 1,
	                            'text': 'こんな感じかに〜\n' + responseUrl
	                        }];
	                    } else {
	                        message = util.message('見つからないかに…');
	                    }

	                    callback(null, to_array, message);
	                }.bind(this));
	            } else {
	                message = util.message('見つからないかに…');
	            }
	        } catch (e) {
	            callback(e);
	        }
	    }.bind(this));
	}

	module.exports = transitMessage;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var request = __webpack_require__(6);
	var xml2json = __webpack_require__(7);
	var logger = __webpack_require__(10);
	var util = __webpack_require__(9);
	var mapSearch = __webpack_require__(18);

	//天気api
	function weatherMessage(wpoint, to_array, callback) {
	    // Yahoo天気api
	    var url = 'http://weather.olp.yahooapis.jp/v1/place';
	    //logger.log(logger.type.INFO, 'yahoo weather: ' + process.env.YAPPID);

	    logger.log(logger.type.INFO, 'weatherMessage: ');

	    var place = null;
	    if (wpoint.indexOf('の') != -1) {
	        place = wpoint.substring(0, wpoint.indexOf('の'));
	    } else if (wpoint.indexOf('は') != -1) {
	        place = wpoint.substring(0, wpoint.indexOf('は'));
	    } else if (wpoint.indexOf(' ') != -1) {
	        place = wpoint.substring(0, wpoint.indexOf(' '));
	    } else if (wpoint.indexOf('、') != -1) {
	        place = wpoint.substring(0, wpoint.indexOf('、'));
	    }

	    var location = {};

	    var locationMessage = function locationMessage(err, location) {

	        if (err || !location) {
	            console.log(err);
	            callback(err);
	        }

	        // yahoo天気 リクエストパラメータの設定
	        var query = {
	            appid: process.env.YAPPID,
	            coordinates: location.lng + ',' + location.lat
	        };

	        var options = {
	            url: url,
	            //proxy: process.env.PROXY,
	            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
	            qs: query,
	            json: true
	        };

	        logger.log(logger.type.INFO, 'weatherMessage: query:' + JSON.stringify(query));

	        request.get(options, function (error, response /*, body*/) {
	            try {
	                var xml = response.body;
	                var _json = xml2json.toJson(xml);
	                var obj = JSON.parse(_json);
	                var weathers = obj.YDF.Feature.Property.WeatherList.Weather;
	                var rainfall = Number(weathers[0].Rainfall) * 100;

	                var message = [];
	                var text = location.name + '近辺の現在の降水確率は、' + rainfall + '%かに\n ※降水強度（単位：mm/h）';

	                message = util.message(text);

	                callback(null, to_array, message);
	            } catch (e) {
	                console.log(e);
	                callback(e);
	            }
	        });
	    };

	    if (place) {
	        mapSearch(place, locationMessage);
	    } else {
	        //デフォルト武蔵中原
	        location = {
	            name: '武蔵中原駅',
	            lat: '35.581154',
	            lng: '139.641474'
	        };

	        locationMessage(null, location);
	    }
	}

	module.exports = weatherMessage;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	//alarm
	var schedule = __webpack_require__(22);
	var Linebot = __webpack_require__(12);
	var util = __webpack_require__(9);

	function alarmMessage(args) {
	    //TODO アラーム機能
	    var setDate = new Date();
	    setDate.setMinutes(setDate.getMinutes() + Number(args.option.time));
	    var job = schedule.scheduleJob(setDate, function () {
	        Linebot(args.to_array, util.message('時間が経ったよ！'));
	    });
	    job.on('scheduled', function () {
	        console.log('予定が登録されました');
	    });
	}

	module.exports = alarmMessage;

/***/ },
/* 22 */
/***/ function(module, exports) {

	module.exports = require("node-schedule");

/***/ }
/******/ ]);
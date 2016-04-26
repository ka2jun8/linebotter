//TODO
//TODO File 出力
//ログはlog4jsを使う
//./logs.htmlでログfrontailに飛ばす-> nginx
//ベーシック認証はつける

var Log4js = require('log4js');
// 設定ファイル（log-config.json）の読み込み
Log4js.configure('log-config.json');
// ログ出力 
var systemLogger = Log4js.getLogger('system');

const prefix= 'kanilog:::';
let logger={
    type: {
        ERROR:0,
        WARNING:1,
        INFO:2
    },
    log:(type, text)=>{
        systemLogger.info(prefix+text);
    }
};

module.exports = logger;
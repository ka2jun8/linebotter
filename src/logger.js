const prefix= 'kanilog:::';
let logger={
    //TODO File 出力
    //  ERROR, WARNING, ... 設定によって表示をかえる
    type: {
        ERROR:0,
        WARNING:1,
        INFO:2
    },
    log:(type, text)=>{
        console.log(prefix+'['+type+']'+text);
    }
};

module.exports = logger;
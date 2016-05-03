const logger = require('./logger');
const Util = {
    //トークタイプ
    TALKTYPE : {
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
            value: ['ごはん','めし'],
            GROUMET_SEARCH: {
                key: '2-1',
                value: ['.+']
            },
            RESULTS: {
                key: '2-2',
                value: ['他','ほか']
            }            
        },
        FRIEND: {
            key:'3',
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
            key:'4',
            value: ['あらーむ'],
            ACCEPT: {
                key:'4-1',
                value: ['\d'] 
            }
        },
        GMAP:{
            WHERE: {
                key:'5-1',
                value: ['ってどこ？']
            },
            GOTO: {
                key:'5-2',
                value: ['いきかた','行き方','\^\.\+から\.\+まで\$']
            }
        },
        WEATHER:{
            key:'6',
            value: ['雨','あめ','天気','降水確率']
        },
        TALK:{
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
            WHATTIME:{
                key: '9-4',
                value: ['いまなんじ','今なんじ','今何時']
            }
        },
        ERROR: {
            key: '-1',
            value: '*'
        }
    },

    //テキスト判定
    checkText: (targets, words, text)=>{
        let result = false;
        targets.forEach((target)=>{
            let reg = new RegExp (target);
            if(text.match(reg)){
                console.log('regExp true');
                result = true; 
            }
            if(text.indexOf(target)!=-1){
                result = true;
            }
            words.forEach((word)=>{
                if(word.reading.indexOf(target)!=-1){
                    result = true;
                }
            });
        });
        return result;
    },

    //テキストセット
    message: (text)=>{
        //logger.log(logger.type.INFO, 'create message *<- '+text);
        let obj = [{
            'contentType': 1,
            'text': text
        }];
        return obj;
    },
    //テキスト+画像セット
    textImage: (text,imageArray)=>{
        //logger.log(logger.type.INFO, 'create message *<- '+text);
        let obj = [
            {
                'contentType': 1,
                'text': text
            },
             // 画像
            {
                'contentType': 2,
                'originalContentUrl': imageArray[0],
                'previewImageUrl': imageArray[0]
            }
        ];
        return obj;
    },
    //テキストセット
    textImageLocation: (text,imageArray,location)=>{
        //logger.log(logger.type.INFO, 'create message *<- '+text);
        let obj = [
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
                'contentType':7,
                'text': location.name,
                'location':{
                    'title': location.title,
                    'latitude': location.lat,
                    'longitude': location.lng
                }
            }];
        logger.log(logger.type.INFO, 'create message *<- '+JSON.stringify(obj));
        return obj;
    },
    
    //@param time 1:day,2:time
    calcTime: (time)=>{
        //今日の日付データを変数hidukeに格納
        const date=new Date(); 
        //年・月・日・曜日を取得する
        const year = date.getFullYear();
        const month = date.getMonth()+1;
        const week = date.getDay();
        const day = date.getDate();
        const yobi= new Array('日','月','火','水','木','金','土');
        const hour = date.getHours(); // 時
        const min = date.getMinutes(); // 分
        const sec = date.getSeconds(); // 秒
        const ymd = year+'年'+month+'月'+day+'日 '+yobi[week]+'曜日';
        const hms = hour + '時' + min + '分' + sec + '秒';
        let ret;
        if(time===0){
            ret = {
                year: year,
                month: month,
                day: day,
                hour: hour,
                min: min,
                sec: sec
            };
        }
        else if(time===1){ 
            ret = ymd;  
        }
        else if(time===2){
            ret = hms;  
        }
        else {
            ret = ymd+' '+hms;  
        }
        return ret;
    }   
};

module.exports = Util;

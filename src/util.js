
const Util = {
    //トークタイプ
    TALKTYPE : {
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
    message: (text)=>{
        let obj = [{
            'contentType': 1,
            'text': text
        }];
        return obj;
    }
};

module.exports = Util;

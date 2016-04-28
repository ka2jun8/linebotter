const util = require('../util');
const logger = require('../logger');
const redis = require('redis');

function plainTextMessage(text, args, callback){
    if(typeof args.next !== 'undefined'){
        logger.log(logger.type.INFO, 'Parser: set talktype '+JSON.stringify(args.next));
        args.client.set('talktype', JSON.stringify(args.next), redis.print);
    }
    else{
        logger.log(logger.type.INFO, 'Parser: set talktype '+JSON.stringify(util.TALKTYPE.OTHER));
        args.client.set('talktype', JSON.stringify(util.TALKTYPE.OTHER), redis.print);
    }
    callback(null, args.to_array, text);
}

module.exports = plainTextMessage;
const request = require('request');
const xml2json = require('xml2json');
const logger = require('../logger');
const util = require('../util');

//天気api
function dictionaryMessage(wpoint, to_array, callback) {
    // デジぞう辞書api 
    const listurl = 'http://public.dejizo.jp/NetDicV09.asmx/SearchDicItemLite';
    const wordurl = 'http://public.dejizo.jp/NetDicV09.asmx/GetDicItemLite';
    //logger.log(logger.type.INFO, 'yahoo weather: ' + process.env.YAPPID);
    
    logger.log(logger.type.INFO, 'dictionaryMessage: ');

}

module.exports = dictionaryMessage;
//alarm
const schedule = require('node-schedule');
const Linebot = require('../linebot');
const util = require('../util');

function alarmMessage(args){  
    //TODO アラーム機能
    const now = util.calcTime(0);
    const min = Number(now.min)+Number(args.option.time);
    let setDate = new Date(now.year, now.month, now.day, now.hour, min, now.sec);
    console.log(setDate);
    let job = schedule.scheduleJob(
        setDate,  
        function(_args){
            console.log('アラート実行'+_args);
            Linebot(args.to_array, util.message('わー！'));
        }.bind(null, args)
    );
    job.on('scheduled', function () {
        console.log('予定が登録されました');
    });

}

module.exports = alarmMessage;
//alarm
const schedule = require('node-schedule');
const Linebot = require('../linebot');
const util = require('../util');

function alarmMessage(args){  
    //TODO アラーム機能
    const setDate = new Date();
    setDate.setMinutes(setDate.getMinutes() + Number(args.option.time));
    let job = schedule.scheduleJob(
        setDate,
        function(){
            Linebot(args.to_array, util.message('時間が経ったよ！'));
        }
    );
    job.on('scheduled', function () {
        console.log('予定が登録されました');
    });

}

module.exports = alarmMessage;
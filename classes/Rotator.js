const rotate = require('log-rotate')
const path = require('path')
const CronJob = require('cron').CronJob;


class Rotator {

    //--- Adds an automatic rotation for specified file -------------------------------------
    setRotation(file, frequency, retention) {
        new CronJob(frequency, function() {
            rotate(path.resolve(file), { count: retention }, function(err) {
                let fname = path.basename(file)
                if (err !== null) {
                    logger.warn('File ' + fname + ' : rotation error : ' + err)
                } else {
                    logger.info('File ' + fname + ' : rotation OK')
                }
              });
        }, null, true, 'Europe/Paris')
    }
}

module.exports = Rotator
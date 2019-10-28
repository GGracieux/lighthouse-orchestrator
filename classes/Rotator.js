const fs = require('fs')
const rotate = require('log-rotate')
const path = require('path')
const rimraf = require('rimraf')
const CronJob = require('cron').CronJob;


class Rotator {

    //--- Adds an automatic rotation for specified file -------------------------------------
    setFileRotationRetention(file, frequency, retention) {
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

    //--- Adds an automatic purge for YYYY/MM/DD directory structure -------------------------
    setTimeTreeRetention(directory, frequency, retention) {
        new CronJob(frequency, function() {

            // folders to remove
            let rmFolders = []

            // calculates min retention date
            let d = new Date()
            d.setDate(d.getDate()-retention)

            // current month folder
            let monthFolder = directory + '/' + d.getFullYear() + '/' + (d.getMonth()+1).toString().padStart(2,0) + '/'
            for(let day=d.getDate(); day--; day>0) {
                let folder = monthFolder + day.toString().padStart(2,0)
                if (fs.existsSync(folder)) {
                    rmFolders.push(folder)
                }
            }

            // current year folder
            let yearFolder = directory + '/' + d.getFullYear() + '/'
            for(let month=d.getMonth()+1; month--; month>0) {
                let folder = yearFolder + month.toString().padStart(2,0)
                if (fs.existsSync(folder)) {
                    rmFolders.push(folder)
                }
            }

            // previous year folders
            for(let year=d.getFullYear(); year--; year>2000) {
                let folder = directory + '/' + year
                if (fs.existsSync(folder)) {
                    rmFolders.push(folder)
                }
            }

            // deleting folders
            rmFolders.forEach(folder => {
                rimraf(folder, err => {
                    if (err !== null) {
                        global.logger.warn('Directory ' + folder + ' : unable to remove : ' + err)
                    } else {
                        global.logger.warn('Directory ' + folder + ' : removal OK')
                    }
                })
            })

        }, null, true, 'Europe/Paris')
    }
}

module.exports = Rotator
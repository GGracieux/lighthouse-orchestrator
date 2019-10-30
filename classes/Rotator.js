const fs = require('fs')
const rotate = require('log-rotate')
const path = require('path')
const rimraf = require('rimraf')
const CronJob = require('cron').CronJob;


class Rotator {

    //--- Adds an automatic rotation for specified file -------------------------------------
    setFileRotation(file, frequency, retention) {
        new CronJob(frequency, function() {

            // info
            let fname = path.basename(file)
            logger.info('File rotation : ' + fname)

            // rotation
            rotate(path.resolve(file), {count: retention }, function(err) {
                if (err !== null) {
                    logger.warn('File ' + fname + ' : rotation error : ' + err)
                } else {
                    logger.info('File ' + fname + ' : rotation OK')
                }
              });

        }, null, true)
    }

    //--- Adds an automatic purge for specified directory -------------------------------------
    setDirectoryRetention(directory, frequency, retention) {
        new CronJob(frequency, function() {

            // info
            logger.info('Purge directory (max ' + retention + ' days) : ' + directory)

            // calc min timestamp
            let currTs = Date.now()
            let minTs = currTs - (retention * 24 * 60 * 60 * 1000)

            // list files
            let files = fs.readdirSync(directory)
            files.forEach(file => {

                // gets ctime
                let fname = path.resolve(directory) + '/' + file
                let fstats = fs.statSync(fname)

                // delete old files
                if (fstats.ctimeMs < minTs ) {
                    fs.unlink(fname, (err) => {
                        if (err) {
                            logger.warn('File ' + file + ' : unable to delete : ' + err)
                        } else {
                            logger.info('File ' + file + ' : deletion OK')
                        }
                    });
                };
            });

        }, null, true)
    }

    //--- Adds an automatic purge for YYYY/MM/DD directory structure -------------------------
    setTimeTreeRetention(directory, frequency, retention) {
        new CronJob(frequency, function() {

            // infos
            logger.info('Purge timetree directory (max ' + retention + ' days) : ' + directory)

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

        }, null, true)
    }
}

module.exports = Rotator
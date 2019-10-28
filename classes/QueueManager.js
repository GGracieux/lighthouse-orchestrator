// Dependencies
const fs = require('fs');
const path = require('path');
var CronJob = require('cron').CronJob;

class QueueManager {

    //--- Initialisation ------------------------------
    constructor() {
        this.cronjobs = []
    }

    //--- Starts job auto enqueuing  ------------------------------
    setAutoReloadOnConfigChange() {
        fs.watchFile(__dirname + '/../conf/jobs.json', (curr, prev) => {
            logger.info('Job conf changed, reloading')
            this.startEnqueuer()
        });
    }

    //--- Starts job auto enqueuing  ------------------------------
    startEnqueuer() {

        // Stop current cronjobs
        this.stopEnqueuer()

        // Reads job file
        var jobFile = JSON.parse(fs.readFileSync(__dirname + '/../conf/jobs.json', 'utf8'));

        // Creates cron jobs
        jobFile.jobs.forEach(job => {
            this.cronjobs.push(new CronJob(job.cron, function() {

                // writes one job per profile
                job.profiles.forEach(profile => {

                    // creates job id
                    let ts = new Date()
                    let rnd = Math.floor(Math.random() * Math.floor(999))
                    let jobId = ts.getTime() + '-' + rnd.toString().padStart(3, '0')

                    // compose run json
                    let runStr = JSON.stringify({
                        id: jobId,
                        url: job.url,
                        profile: profile,
                        qdate: ts.toISOString()
                    })

                    // log
                    logger.info('Job '  + jobId + ' : Adding (' + profile + ') ' + job.url)

                    // writes job run file
                    fs.writeFileSync(__dirname + '/../data/tmp/' + jobId + '.run.json', runStr, 'utf8')

                })

            }, null, true, 'Europe/Paris'));
        });
    }

    //--- Stops job auto enqueuing  ------------------------------
    stopEnqueuer() {
        this.cronjobs.forEach(cronjob => {
            cronjob.stop()
        }) 
        this.cronjobs = []
    }

    //--- Gets a list of job wainting to be run  ------------------------------
    getJobIdsToRun() {

        // List all files in tmp
        let files = fs.readdirSync(__dirname + '/../data/tmp/') 

        // Separate .runs and .report files
        var runs = []
        var reports = []
        files.forEach(function (file) {
            let fparts = file.split('.')
            switch (fparts[1]) {
                case 'run':
                    runs.push(fparts[0])
                    break;
                case 'report':
                    reports.push(fparts[0])
                    break;
            }
        });

        // Deduplicate
        runs = runs.filter(function(elem, pos) {
            return runs.indexOf(elem) == pos;
        })
        reports = reports.filter(function(elem, pos) {
            return reports.indexOf(elem) == pos;
        })

        // Removing runs already having reports
        reports.forEach(function (jobid) {
            let index = runs.indexOf(jobid);
            if (index > -1) {
                runs.splice(index, 1);
            }
        })  
        
        return runs
    }

    //--- Remove job from queue -------------------------------------
    removeJob(jobId) {
        let runFilePath = __dirname + '/../data/tmp/' + jobId + '.run.json'
        fs.unlinkSync(runFilePath)
    }

    //--- Remove everything from queue ------------------------------
    emptyQueue() {
        let files = fs.readdirSync(__dirname + '/../data/tmp/')
        for (const file of files) {
            fs.unlinkSync(path.join(__dirname + '/../data/tmp/', file))
        }
    }

}

module.exports = QueueManager
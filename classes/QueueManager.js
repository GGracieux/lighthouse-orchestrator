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
        fs.watchFile(global.args.config_dir + '/jobs.json', (curr, prev) => {
            logger.info('Job conf changed, reloading')
            this.startEnqueuer()
        });
    }

    //--- Starts job auto enqueuing  ------------------------------
    startEnqueuer() {

        // stop current cronjobs
        this.stopEnqueuer()

        // reads job file
        var jobFile = JSON.parse(fs.readFileSync(global.args.config_dir + '/jobs.json', 'utf8'));

        // creates cron jobs
        jobFile.jobs.forEach(job => {
            this.cronjobs.push(new CronJob(job.cron, function() {

                // writes one job per profile
                job.profiles.forEach(profile => {

                    // creates job id
                    let ts = new Date()
                    let rnd = Math.floor(Math.random() * Math.floor(999))
                    let jobId = ts.getTime() + '-' + rnd.toString().padStart(3, '0')

                    // compose run json
                    let run = JSON.parse(JSON.stringify(job))
                    delete run.profiles
                    delete run.cron
                    run.id = jobId
                    run.profile = profile
                    run.qdate = ts.toISOString()

                    // log
                    logger.info('Job '  + jobId + ' : Adding (' + profile + ') ' + job.url)

                    // writes job run file
                    fs.writeFileSync(global.args.data_dir + '/tmp/' + jobId + '.run.json', JSON.stringify(run), 'utf8')

                })

            }, null, true));
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

        // list all files in tmp
        let files = fs.readdirSync(global.args.data_dir + '/tmp/')

        // split .runs and .report files
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

        // deduplicate
        runs = runs.filter(function(elem, pos) {
            return runs.indexOf(elem) == pos;
        })
        reports = reports.filter(function(elem, pos) {
            return reports.indexOf(elem) == pos;
        })

        // removing runs already having reports
        reports.forEach(function (jobid) {
            let index = runs.indexOf(jobid);
            if (index > -1) {
                runs.splice(index, 1);
            }
        })  
        
        return runs
    }

    //--- Remove specific job from queue -------------------------------------
    removeJob(jobId) {
        let runFilePath = global.args.data_dir + '/tmp/' + jobId + '.run.json'
        fs.unlinkSync(runFilePath)
    }

    //--- Remove everything from queue ------------------------------
    emptyQueue() {
        let files = fs.readdirSync(global.args.data_dir + '/tmp/')
        for (const file of files) {
            fs.unlinkSync(path.join(global.args.data_dir + '/tmp/', file))
        }
    }

}

module.exports = QueueManager
// Dependencies
const fs = require('fs');
const path = require('path');
const CronJob = require('cron').CronJob;
const Configuration = require('./Configuration.js')

class QueueManager {

    //--- Initialisation ------------------------------
    constructor() {
        this.cronjobs = []
        this.config = new Configuration()
    }

    //--- Starts job auto enqueuing  ------------------------------
    setAutoReloadOnConfigChange() {
        fs.watchFile(this.config.getJobsPath(), (curr, prev) => {
            logger.info('Job conf changed, reloading')
            this.startEnqueuer()
        });
    }

    //--- Starts job auto enqueuing  ------------------------------
    startEnqueuer() {

        // stop current cronjobs
        this.stopEnqueuer()

        // reads job file
        var jobFile = JSON.parse(fs.readFileSync(this.config.getJobsPath(), 'utf8'));

        // creates cron jobs
        jobFile.jobs.forEach(job => {
            this.cronjobs.push(new CronJob(job.cron, function() {

                // writes one job per profile
                job.profiles.forEach(profile => {

                    // creates job id
                    let ts = new Date()
                    let rnd = Math.floor(Math.random() * Math.floor(999))
                    let jobId = ts.getTime() + '-' + rnd.toString().padStart(3, '0')

                    // compose jobConf json
                    let jobConf = JSON.parse(JSON.stringify(job))
                    delete jobConf.profiles
                    delete jobConf.cron
                    jobConf.id = jobId
                    jobConf.profile = profile
                    jobConf.qdate = ts.toISOString()

                    // log
                    logger.info(logger.getJobStatusChangeMessage(jobConf, 'Adding'))

                    // writes job waiting file
                    fs.writeFileSync(global.args.data_dir + '/queue/' + jobId + '.waiting.json', JSON.stringify(jobConf), 'utf8')

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

    //--- Prepares next job for run ------------------------------
    prepareNextJobForRun(workerId, callBack) {

        let that = this

        // takes semaphore for job choice
        global.jobChoice.take(function() {

            // gets next jobs id list
            let jobs = that.getWaitingJobsIds()
            if (jobs.length == 0) {
                global.jobChoice.leave()
                callBack(null)
                return
            }

            // loads next job configuration
            let jobRootPath = global.args.data_dir + '/queue/'+ jobs[0]
            let jobConf = JSON.parse(fs.readFileSync(jobRootPath + '.waiting.json', 'utf8'));
            jobConf.workerId = workerId

            // Change job to running state
            fs.renameSync(jobRootPath + '.waiting.json', jobRootPath + '.running.json')

            // leaves semaphore and chain callback
            global.jobChoice.leave()
            callBack(jobConf)
        })

    }

    //--- Gets a list of job wainting to be run  ------------------------------
    getWaitingJobsIds() {

        // list all files in queue
        let files = fs.readdirSync(global.args.data_dir + '/queue/')

        // filter .waiting jobs
        var waiting = []
        files.forEach(function (file) {
            let fparts = file.split('.')
            if (fparts[1] == 'waiting') {
                waiting.push(fparts[0])
            }
        });
        
        return waiting
    }

    //--- Remove specific job from queue -------------------------------------
    removeRunningJob(jobId) {
        let runFilePath = global.args.data_dir + '/queue/' + jobId + '.run.json'
        if (fs.existsSync(runFilePath)) {
            fs.unlinkSync(runFilePath)
        }
    }

    //--- Remove everything from queue ------------------------------
    emptyQueue() {
        let files = fs.readdirSync(global.args.data_dir + '/queue/')
        for (const file of files) {
            fs.unlinkSync(path.join(global.args.data_dir + '/queue/', file))
        }
    }

}

module.exports = QueueManager
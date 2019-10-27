// Dependencies
const fs = require('fs');
const path = require('path');
var CronJob = require('cron').CronJob;

class QueueManager {

    //--- Starts job auto enqueuing  ------------------------------
    startEnqueuer() {

        // Reads job file
        var jobFile = JSON.parse(fs.readFileSync(__dirname + '/../conf/jobs.json', 'utf8'));

        // Creates cron jobs
        jobFile.jobs.forEach(job => {
            new CronJob(job.cron, function() {

                // creates job id
                let ts = new Date()
                let rnd = Math.floor(Math.random() * Math.floor(999))
                let jobid = ts.getTime() + '-' + rnd.toString().padStart(3, '0')

                // log
                let action = 'Adding'
                logger.info('Job '  + jobid + ' - ' + action.padEnd(10,' ') + ' : ' + job.url)

                // writes job run file
                job.qdate = ts.toISOString()
                fs.writeFileSync(__dirname + '/../data/tmp/' + jobid + '.run.json', JSON.stringify(job), 'utf8')

            }, null, true, 'Europe/Paris');
        });
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
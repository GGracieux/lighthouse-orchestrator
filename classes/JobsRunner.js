const fs = require('fs')
const path = require('path')
const QueueManager = require('./QueueManager.js')
const Lighthouse = require('./Lighthouse.js')
const mkdirp = require('mkdirp');
const slugify = require('slugify')
const glob = require("glob")

class JobsRunner {

    //--- Initialisation ------------------------------
    constructor() {

        // queue manager
        this.qm = new QueueManager()
        this.qm.emptyQueue()
        this.qm.setAutoReloadOnConfigChange()
        this.qm.startEnqueuer()

        // lighthouse
        this.lighthouse = new Lighthouse()

    }

    //--- Runs a lighthouse test ------------------------------
    runQueue(workerId) {

        let that = this
        this.qm.prepareNextJobForRun(workerId, function(jobConf) {

            if (jobConf !== null ) {

                logger.info(logger.getJobStatusChangeMessage(jobConf, 'Launching'))
                that.lighthouse.runJob(jobConf).then(
                    jobResult => {

                        // process job result
                        that.processJobResult(jobResult)
                        logger.info(logger.getJobStatusChangeMessage(jobResult.jobConf, 'Ending'))
    
                        // remove ran job from queue and launch next
                        that.qm.removeRunningJob(jobResult.jobConf.id)
                        that.runQueue(workerId)

                    },
                    err => {
    
                        // log errors and clean the mess
                        logger.error(logger.getJobStatusChangeMessage(jobResult.jobConf, 'Error', ' - see /logs/errors folder'))
                        that.archiveErrorFiles(err)

                        // launch next job
                        that.runQueue(workerId)
                    }
                )
            } else {
                logger.info('Worker' + String(workerId).padStart(2,'0') + ', no test in queue, waiting ...')
                setTimeout(function(){ that.runQueue(workerId)}.bind(that), 60000);
            }

        })

    }

    //--- Process lighthouse job results ------------------------------
    processJobResult(jobResult) {

        // action log
        logger.info(logger.getJobStatusChangeMessage(jobResult.jobConf, 'Processing'))

        // result log
        if (global.conf.logs.results.fields.run.length + global.conf.logs.results.fields.lighthouse.length > 0) {
            this.logResults(jobResult)
        }

        // saving reports
        if (global.conf.reports.formats.length > 0) {
            this.archiveReports(jobResult)
        }
    }

    //--- Extract results from json reports and log to file ------------------------------
    logResults(jobResult) {
    
        // reads report.json
        let reportPath = global.args.data_dir + '/queue/' + jobResult.jobConf.id + '.report'
        let report = JSON.parse(fs.readFileSync(reportPath + '.json', 'utf8'));

        // init result
        let line = ''

        // adding lightkeeper fields
        global.conf.logs.results.fields.run.forEach(key => {
            if (jobResult.jobConf.hasOwnProperty(key)) {
                line += jobResult.jobConf[key]
            }
            line += ';'
        })

        // extracting lighthouse data
        global.conf.logs.results.fields.lighthouse.forEach(key => {
            let keyparts = key.split('.')
            let item = report
            try {
                keyparts.forEach(keypart => {
                    if (item.hasOwnProperty(keypart)) {
                        item = item[keypart]
                    } else {
                        throw "not found property";
                    }
                })
            } catch(e) {
                item = ''
            }
            line += ";" + item
        })

        // writing result to log
        fs.appendFile(global.args.data_dir + '/logs/results.log', line+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    //--- Archive lighthouse reports to final directory ------------------------------
    archiveReports(jobResult) {

        // creating directory structure for report storage
        let d = new Date()
        let datePart = d.getFullYear() + '/' + (d.getMonth()+1).toString().padStart(2,0) + '/' + d.getDate().toString().padStart(2,0)
        let archiveDir = global.args.data_dir + '/reports/' + datePart + '/'
        mkdirp.sync(archiveDir)

        // moving reports
        let reportPath = global.args.data_dir + '/queue/' + jobResult.jobConf.id + '.report'
        global.conf["reports"]["formats"].forEach(format => {
            fs.renameSync(reportPath + '.' + format, archiveDir + jobResult.jobConf.id + '-' + jobResult.jobConf.profile + '-' + slugify(jobResult.jobConf.url).substring(0, 100) + '.' + format)
        });

        //removing json report
        if (!global.conf["reports"]["formats"].includes('json')) {
            fs.unlinkSync(reportPath + '.json')
        }
    }

    //--- Archive temporary files to lo------------------------------
    archiveErrorFiles(err) {

        // moves temporary files
        let queueDir = path.resolve(global.args.data_dir + '/queue/' + err.jobConf.id)
        let jobFiles = glob.sync(queueDir+ '*')
        jobFiles.forEach(jobFile => {
            fs.renameSync(jobFile, global.args.data_dir + '/logs/errors/' + path.basename(jobFile))
        })

        //log error trace
        fs.writeFileSync(global.args.data_dir + '/logs/errors/' + err.jobConf.id + '.error.json', JSON.stringify(err));
    }

}

module.exports = JobsRunner
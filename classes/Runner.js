const fs = require('fs')
const path = require('path')
const QueueManager = require('./QueueManager.js')
const Lighthouse = require('./Lighthouse.js')
const Webserver = require('./Webserver.js')
const Rotator = require('./Rotator.js')
const mkdirp = require('mkdirp');
const slugify = require('slugify')
const glob = require("glob")

class Runner {

    //--- Initialisation ------------------------------
    constructor() {

        // queue manager
        this.qm = new QueueManager()
        this.qm.emptyQueue()
        this.qm.setAutoReloadOnConfigChange()
        this.qm.startEnqueuer()

        // lighthouse
        this.lighthouse = new Lighthouse()

        // log rotator
        let rotator = new Rotator()
        rotator.setRotation(__dirname + '/../data/logs/lightkeeper.log', '* * 2 * * *', global.conf.retention.logs)
        rotator.setRotation(__dirname + '/../data/logs/results.log', '* * 2 * * *', global.conf.retention.logs)

        // webserver
        if (global.conf.webserver.enabled) {
            let webserver = new Webserver()
            webserver.start(global.conf.webserver.port)
        }
    }

    //--- Runs a lighthouse test ------------------------------
    runQueue() {

        let jobs = this.qm.getJobIdsToRun()
        if (jobs.length > 0) {
          
            let jobConf = JSON.parse(fs.readFileSync(__dirname + '/../data/tmp/'+ jobs[0] + '.run.json', 'utf8'));

            this.lighthouse.runJob(jobConf).then(
                jobResult => {
    
                    // Process job result
                    this.processJobResult(jobResult)

                    // Remove job from queue
                    logger.info('Job ' + jobResult.jobConf.id  + ' : Ending (' + jobResult.jobConf.profile + ') ' + jobResult.jobConf.url)
                    this.qm.removeJob(jobResult.jobConf.id)
    
                    // Launch next job
                    this.runQueue()
                
                },
                err => {

                    // Log error
                    logger.error('Job ' + err.jobConf.id  + ' : Error (' + err.jobConf.profile + ') ' + err.jobConf.url)
                    logger.error(JSON.stringify(err))

                    // Clean error
                    this.cleanMess(err)

                    // Launch next job
                    this.runQueue()
                }
            )
        } else {
            logger.info('No test in queue, waiting ...')
            setTimeout(this.runQueue.bind(this), 60000);
        }
    }

    //--- Process lighthouse job results ------------------------------
    processJobResult(jobResult) {

        // Log
        logger.info('Job ' + jobResult.jobConf.id + ' : Processing (' + jobResult.jobConf.profile + ') ' + jobResult.jobConf.url)

        // Log des résultats
        if (global.conf.logs.params || global.conf.logs.fields.length > 0) {
            this.logResults(jobResult) 
        }

        // Archivage des rapports
        if (global.conf.reports.formats.length > 0) {
            this.archiveReports(jobResult)
        }
        
    }

    //--- Extract results from json reports and log to file ------------------------------
    logResults(jobResult) {
    
        // reads report.json
        let reportPath = __dirname + '/../data/tmp/' + jobResult.jobConf.id + '.report'
        let report = JSON.parse(fs.readFileSync(reportPath + '.json', 'utf8'));

        // extracting data
        let line = (global.conf.logs.params) ? jobResult.jobConf.id + ';' + jobResult.jobConf.url + ';' + jobResult.jobConf.profile + ';' + jobResult.jobConf.qdate : ''
        global.conf.logs.fields.forEach(key => {
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
        fs.appendFile(__dirname + '/../data/logs/results.log', line+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }

    //--- Archive lighthouse reports to final directory ------------------------------
    archiveReports(jobResult) {

        // Creating directory structure for report storage
        let d = new Date()
        let datePart = d.getFullYear() + '/' + (d.getMonth()+1).toString().padStart(2,0) + '/' + d.getDate().toString().padStart(2,0)
        let archiveDir = __dirname + '/../data/reports/' + datePart + '/'
        mkdirp.sync(archiveDir)

        // Moving reports
        let reportPath = __dirname + '/../data/tmp/' + jobResult.jobConf.id + '.report'
        global.conf["reports"]["formats"].forEach(format => {
            fs.renameSync(reportPath + '.' + format, archiveDir + jobResult.jobConf.id + '-' + jobResult.jobConf.profile + '-' + slugify(jobResult.jobConf.url).substring(0, 100) + '.' + format)
        });

        // Removing json report
        if (!global.conf["reports"]["formats"].includes('json')) {
            fs.unlinkSync(reportPath + '.json')
        }
    }

    //--- Clean the mess ------------------------------
    cleanMess(err) {
        let tmpdir = path.resolve(__dirname + '/../data/tmp/' + err.jobConf.id)
        let jobFiles = glob.sync(tmpdir+ '*')
        jobFiles.forEach(jobFile => {
            console.log(jobFile)
            fs.unlinkSync(jobFile)
        })
    }

}

module.exports = Runner
const fs = require('fs');
const QueueManager = require('./QueueManager.js')
const Lighthouse = require('./Lighthouse.js')
const Webserver = require('./Webserver.js')
const mkdirp = require('mkdirp');
const slugify = require('slugify')

class Runner {

    //--- Initialisation ------------------------------
    constructor() {

        this.qm = new QueueManager()
        this.qm.emptyQueue()
        this.qm.startEnqueuer()

        this.lighthouse = new Lighthouse()

        let webserver = new Webserver()
        webserver.start()
        
    }

    //--- Runs a lighthouse test ------------------------------
    runQueue() {

        let jobs = this.qm.getJobIdsToRun()
        if (jobs.length > 0) {
          
            this.lighthouse.runJob(jobs[0]).then(
                result => {
    
                    // Process job result
                    this.processJobResult(result)

                    // Remove job from queue
                    let action = 'Ending'
                    logger.info('Job ' + result.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + result.conf.url)
                    this.qm.removeJob(result.jobId)
    
                    // Launch next job
                    this.runQueue()
                
                },
                err => {
                    let action = 'Error'
                    logger.error('Job ' + err.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + err.conf.url)
                    logger.error(JSON.stringify(err))
                }
            )
        } else {
            logger.info('No test in queue, wainting ...')
            setTimeout(this.runQueue.bind(this), 3000); // 60000
        }
    }

    //--- Process lighthouse job results ------------------------------
    processJobResult(jobResult) {

        // Log
        let action = 'Processing';
        logger.info('Job ' + jobResult.jobId + ' - ' + action.padEnd(10,' ') +  ' : ' + jobResult.conf.url)

        // Log des résultats
        if (global.conf.logs.fields.length > 0) {
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
        let reportPath = __dirname + '/../data/tmp/' + jobResult.jobId + '.report'
        let report = JSON.parse(fs.readFileSync(reportPath + '.json', 'utf8'));

        // extracting data
        let line = jobResult.jobId
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
        let datePart = d.getFullYear() + '/' + d.getMonth().toString().padStart(2,0) + '/' + d.getDay().toString().padStart(2,0)
        let archiveDir = __dirname + '/../data/reports/' + datePart + '/'
        mkdirp.sync(archiveDir)

        // Moving reports
        let reportPath = __dirname + '/../data/tmp/' + jobResult.jobId + '.report'
        global.conf["reports"]["formats"].forEach(format => {
            fs.renameSync(reportPath + '.' + format, archiveDir + jobResult.jobId + '-' + slugify(jobResult.conf.url).substring(0, 100) + '.' + format)
        });

        // Removing json report
        if (!global.conf["reports"]["formats"].includes('json')) {
            fs.unlinkSync(reportPath + '.json')
        }
    }

}

module.exports = Runner
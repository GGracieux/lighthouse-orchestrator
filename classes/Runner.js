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
        rotator.setFileRotation(global.args.data_dir + '/logs/lightkeeper.log', '1 1 2 * * *', global.conf.retention.logs)
        rotator.setFileRotation(global.args.data_dir + '/logs/results.log', '1 1 2 * * *', global.conf.retention.logs)
        rotator.setDirectoryRetention(global.args.data_dir + '/errors', '1 2 2 * * *', global.conf.retention.errors)
        rotator.setTimeTreeRetention(global.args.data_dir + '/reports', '1 2 2 * * *', global.conf.retention.reports)

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
          
            let jobConf = JSON.parse(fs.readFileSync(global.args.data_dir + '/tmp/'+ jobs[0] + '.run.json', 'utf8'));

            this.lighthouse.runJob(jobConf).then(
                jobResult => {
    
                    // process job result
                    this.processJobResult(jobResult)

                    // remove job from queue
                    logger.info('Job ' + jobResult.jobConf.id  + ' : Ending (' + jobResult.jobConf.profile + ') ' + jobResult.jobConf.url)
                    this.qm.removeJob(jobResult.jobConf.id)
    
                    // launch next job
                    this.runQueue()
                
                },
                err => {

                    // log error
                    logger.error('Job ' + err.jobConf.id  + ' : Error (' + err.jobConf.profile + ') ' + err.jobConf.url + ' - see errors folder')

                    // clean error
                    this.cleanMess(err)

                    // launch next job
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

        // action log
        logger.info('Job ' + jobResult.jobConf.id + ' : Processing (' + jobResult.jobConf.profile + ') ' + jobResult.jobConf.url)

        // result log
        if (global.conf.logs.params || global.conf.logs.fields.length > 0) {
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
        let reportPath = global.args.data_dir + '/tmp/' + jobResult.jobConf.id + '.report'
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
        let reportPath = global.args.data_dir + '/tmp/' + jobResult.jobConf.id + '.report'
        global.conf["reports"]["formats"].forEach(format => {
            fs.renameSync(reportPath + '.' + format, archiveDir + jobResult.jobConf.id + '-' + jobResult.jobConf.profile + '-' + slugify(jobResult.jobConf.url).substring(0, 100) + '.' + format)
        });

        //removing json report
        if (!global.conf["reports"]["formats"].includes('json')) {
            fs.unlinkSync(reportPath + '.json')
        }
    }

    //--- Clean failed test------------------------------
    cleanMess(err) {

        // moves temporary files
        let tmpdir = path.resolve(global.args.data_dir + '/tmp/' + err.jobConf.id)
        let jobFiles = glob.sync(tmpdir+ '*')
        jobFiles.forEach(jobFile => {
            fs.renameSync(jobFile, global.args.data_dir + '/errors/' + path.basename(jobFile))
        })

        //log error trace
        fs.writeFileSync(global.args.data_dir + '/errors/' + err.jobConf.id + '.error.json', JSON.stringify(err));
    }

}

module.exports = Runner
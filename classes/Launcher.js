const ArgumentParser = require('./ArgumentParser.js')
const Configuration = require('./Configuration.js')
const fs = require('fs')
const JobsRunner = require('./JobsRunner.js')
const Logger = require('./Logger.js')
const mkdirp = require('mkdirp');
const Rotator = require('./Rotator.js')
const Webserver = require('./Webserver.js')


class Launcher
{

    //--- Starts lightkeeper ------------------------------
    start() {

        // Initialisation
        global.args = new ArgumentParser().parseArgs()
        global.conf = new Configuration().load()
        global.logger = new Logger(global.args.data_dir + '/logs/lightkeeper.log', true)
        global.jobChoice = require('semaphore')(1);
        this.initDataDirectory()
        this.initConfigFiles()
        
        // Let's get to work
        this.startPurgeAuto()
        this.startWebServer()
        this.startJobsRunner()
    }

    //--- Data directory structure creation ------------------------------
    initDataDirectory() {
        mkdirp.sync(global.args.data_dir + '/queue')
        mkdirp.sync(global.args.data_dir + '/logs')
        mkdirp.sync(global.args.data_dir + '/logs/errors')
        mkdirp.sync(global.args.data_dir + '/reports')
    }

    //--- Initialize config_dir files with default if asked to -----------
    initConfigFiles() {
        if (global.args.init_config || global.args.init_profiles) {
            if (!fs.existsSync(global.args.config_dir)) {
                mkdirp.sync(global.args.config_dir)
            }
            if (global.args.init_config) {
                new Configuration().initConfig()
            }
            if (global.args.init_profiles) {
                new Configuration().initProfiles()
            }
        }
    }

    //--- Starts Purge auto and file rotation ------------------------------
    startPurgeAuto() {
         let rotator = new Rotator()
         rotator.setFileRotation(global.args.data_dir + '/logs/lightkeeper.log', '1 1 2 * * *', global.conf.logs.lightkeeper.retentionDays)
         rotator.setFileRotation(global.args.data_dir + '/logs/results.log', '1 1 2 * * *', global.conf.logs.results.retentionDays)
         rotator.setDirectoryRetention(global.args.data_dir + '/logs/errors', '1 2 2 * * *', global.conf.logs.errors.retentionDays)
         rotator.setTimeTreeRetention(global.args.data_dir + '/reports', '1 2 2 * * *', global.conf.reports.retentionDays)
        
    }

    //--- Starts Web server ------------------------------
    startWebServer() {
        if (global.conf.webserver.enabled) {
            let webserver = new Webserver()
            webserver.start(global.conf.webserver.port)
        }        
    }

    //--- Starts JobsRunner ------------------------------
    startJobsRunner() {
        let jobsRunner = new JobsRunner()
        for (let i = 0; i < global.conf.jobsRunner.maxParallelJobs; i++) {
            jobsRunner.runQueue(i+1)
        }
    }

}

module.exports = Launcher
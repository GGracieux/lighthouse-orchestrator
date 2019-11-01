const ArgumentParser = require('./ArgumentParser.js')
const Configuration = require('./Configuration.js')
const Webserver = require('./Webserver.js')
const Rotator = require('./Rotator.js')
const Logger = require('./Logger.js')
const mkdirp = require('mkdirp');
const JobRunner = require('./JobRunner.js')

class Launcher
{

    //--- Starts lightkeeper ------------------------------
    start() {

        // Initialisation
        global.args = new ArgumentParser().parseArgs()
        global.conf = new Configuration().load()
        global.logger = new Logger(global.args.data_dir + '/logs/lightkeeper.log', true)
        this.initDataDirectory()
        
        // Let's get to work
        this.startPurgeAuto()
        this.startWebServer()
        this.startJobRunner()
    }

    //--- Data directory structure creation ------------------------------
    initDataDirectory() {
        mkdirp.sync(global.args.data_dir + '/queue')
        mkdirp.sync(global.args.data_dir + '/logs')
        mkdirp.sync(global.args.data_dir + '/logs/errors')
        mkdirp.sync(global.args.data_dir + '/reports')
    }

    //--- Starts Purge auto and file rotation ------------------------------
    startPurgeAuto() {
         let rotator = new Rotator()
         rotator.setFileRotation(global.args.data_dir + '/logs/lightkeeper.log', '1 1 2 * * *', global.conf.logs.lightkeeper["retention-days"])
         rotator.setFileRotation(global.args.data_dir + '/logs/results.log', '1 1 2 * * *', global.conf.logs.results["retention-days"])
         rotator.setDirectoryRetention(global.args.data_dir + '/logs/errors', '1 2 2 * * *', global.conf.logs.errors["retention-days"])
         rotator.setTimeTreeRetention(global.args.data_dir + '/reports', '1 2 2 * * *', global.conf.reports["retention-days"])
        
    }

    //--- Starts Web server ------------------------------
    startWebServer() {
        if (global.conf.webserver.enabled) {
            let webserver = new Webserver()
            webserver.start(global.conf.webserver.port)
        }        
    }

    //--- Starts JobRunner ------------------------------
    startJobRunner() {
        let jobRunner = new JobRunner()
        jobRunner.runQueue()
    }

}

module.exports = Launcher
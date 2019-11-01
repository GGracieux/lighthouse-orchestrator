// Dependencies
const fs = require('fs');

class Logger {

    //--- Initialisation ------------------------------
    constructor(path, stdOut) {
        this.path = path
        this.stdOut = stdOut
    }

    //--- Writing logs ------------------------------
    write (eventType, message) {

        // Assemble log data
        let logData = new Date().toISOString() + '|' + eventType + '|' + message

        // Standard output
        if (this.stdOut) {
            console.log(logData)
        }

        // File output
        if (this.path != '') {
            fs.appendFile(this.path, logData+"\n", function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    //--- Wrapper : debug ------------------------------
    debug (message) {
        this.write('debug', message)
    }

    //--- Wrapper : info ------------------------------
    info (message) {
        this.write('info', message)
    }

    //--- Wrapper : warn ------------------------------
    warn (message) {
        this.write('warn', message)
    }

    //--- Wrapper : error ------------------------------
    error (message) {
        this.write('error', message)
    }

    //--- Compose message for job status change --------+
    getJobStatusChangeMessage(jobConf, status, additionalText = '') {
        let msg = jobConf.hasOwnProperty('workerId') ? 'Worker' + String(jobConf.workerId).padStart(2,'0') : 'QManager'
        msg += ', Job '  + jobConf.id + ' : ' + status + ' : (' + jobConf.profile + ') ' + jobConf.url + additionalText
        return msg
    }

}

module.exports = Logger
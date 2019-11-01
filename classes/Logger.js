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

}

module.exports = Logger
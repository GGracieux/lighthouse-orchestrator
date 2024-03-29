// Dependencies
const fs = require('fs');
const Configuration = require('./Configuration.js')

class Lighthouse {

    //--- Executes a lightHouse job ------------------------------
    runJob(jobConf) {

        // compose lighthouse command
        let cmd  = 'lighthouse ' + jobConf.url
        cmd += ' --output-path ' + global.args.data_dir + '/queue/' + jobConf.id
        cmd += ' --chrome-flags="--headless --no-sandbox --ignore-certificate-errors"'
        cmd += ' --config-path ' + new Configuration().getProfilePath(jobConf.profile)

        // setting log format
        global.conf["reports"]["formats"].forEach(format => {
            cmd += ' --output ' + format
        });

        // adds json format for result extraction
        if (!global.conf["reports"]["formats"].includes('json')) {
            cmd += ' --output json'
        }
        
        const exec = require('child_process').exec;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject({
                        jobConf: jobConf,
                        stdout: stdout,
                        stderr: stderr,
                        error: error
                    })
                } else {
                    resolve({
                        jobConf: jobConf,
                        stdout: stdout,
                        stderr: stderr
                    });
                }
            });
        });
    }
    
}

module.exports = Lighthouse
// Dependencies
const fs = require('fs');

class Lighthouse {

    //--- Executes a lightHouse job ------------------------------
    runJob(jobId) {
        let job = JSON.parse(fs.readFileSync(__dirname + '/../data/tmp/'+ jobId + '.run.json', 'utf8'));
        let action = 'Launching'
        logger.info('Job '  + jobId + ' - ' + action.padEnd(10,' ') + ' : ' + job.url)
        let cmd  = 'lighthouse ' + job.url
        cmd += ' --output html --output json'
        cmd += ' --output-path ' + __dirname + '/../data/tmp/' + jobId
        cmd += ' --chrome-flags="--headless --no-sandbox"'
        const exec = require('child_process').exec;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject({
                        jobId: jobId,
                        conf: job,
                        stdout: stdout,
                        stderr: stderr,
                        error: error
                    })
                } else {
                    resolve({
                        jobId: jobId,
                        conf: job,
                        stdout: stdout,
                        stderr: stderr
                    });
                }
            });
        });
    }
    
}

module.exports = Lighthouse
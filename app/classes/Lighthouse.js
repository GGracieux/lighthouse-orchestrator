const fs = require('fs');

class Lighthouse {

    //--- Execution d'un test lightHouse ------------------------------
    runJob(jobId) {
        let urlConf = JSON.parse(fs.readFileSync(__dirname + '/../data/tmp/'+ jobId + '.run.json', 'utf8'));
        let action = 'Lancement'
        logger.info('Job '  + jobId + ' - ' + action.padEnd(10,' ') + ' : ' + urlConf.url)
        let cmd  = 'lighthouse ' + urlConf.url
        cmd += ' --output html --output json'
        cmd += ' --output-path ' + __dirname + '/../data/tmp/' + jobId
        cmd += ' --chrome-flags="--headless --no-sandbox"'
        const exec = require('child_process').exec;
        return new Promise((resolve, reject) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject({
                        jobId: jobId,
                        urlConf: urlConf,
                        stdout: stdout,
                        stderr: stderr,
                        error: error
                    })
                } else {
                    resolve({
                        jobId: jobId,
                        urlConf: urlConf,
                        stdout: stdout,
                        stderr: stderr
                    });
                }
            });
        });
    }
    
}

module.exports = Lighthouse
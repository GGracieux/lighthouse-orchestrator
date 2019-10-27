// Dependencies
const fs = require('fs');

class Lighthouse {

    //--- Executes a lightHouse job ------------------------------
    runJob(jobId) {
        let job = JSON.parse(fs.readFileSync(__dirname + '/../data/tmp/'+ jobId + '.run.json', 'utf8'));
        let action = 'Launching'
        logger.info('Job '  + jobId + ' - ' + action.padEnd(10,' ') + ' : ' + job.url)

        // Composition de la commande lighthouse
        let cmd  = 'lighthouse ' + job.url
        cmd += ' --output-path ' + __dirname + '/../data/tmp/' + jobId
        cmd += ' --chrome-flags="--headless --no-sandbox"'

        // Ajout des formats de logs
        global.conf["reports"]["formats"].forEach(format => {
            cmd += ' --output ' + format
        });

        // Ajout du format json pour l'extraction des resultats
        if (!global.conf["reports"]["formats"].includes('json')) {
            cmd += ' --output json'
        }
        
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
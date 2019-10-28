// Dependencies
const fs = require('fs');

class Lighthouse {

    //--- Executes a lightHouse job ------------------------------
    runJob(jobConf) {
        logger.info('Job '  + jobConf.id + ' : Launching : (' + jobConf.profile + ') ' + jobConf.url)

        // Composition de la commande lighthouse
        let cmd  = 'lighthouse ' + jobConf.url
        cmd += ' --output-path ' + __dirname + '/../data/tmp/' + jobConf.id
        cmd += ' --chrome-flags="--headless --no-sandbox"'
        cmd += ' --config-path ' + __dirname + '/../conf/profile.' + jobConf.profile + '.json'

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
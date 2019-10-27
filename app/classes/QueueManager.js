// dependences
const fs = require('fs');
const path = require('path');
var CronJob = require('cron').CronJob;

class QueueManager {

    //--- Démarre la mise en file auto des jobs ------------------------------
    startEnqueuer() {

        // lecture de la liste des urls a tester
        var urlFile = JSON.parse(fs.readFileSync(__dirname + '/../conf/urls.json', 'utf8'));

        // creation des jobs
        urlFile.urls.forEach(url => {
            new CronJob(url.cron, function() {

                // determine les infos du job
                let ts = new Date()
                let rnd = Math.floor(Math.random() * Math.floor(999))
                let jobid = ts.getTime() + '-' + rnd.toString().padStart(3, '0')

                // Log
                let action = 'Ajout'
                logger.info('Job '  + jobid + ' - ' + action.padEnd(10,' ') + ' : ' + url.url)

                // Ecriture du fichier de run
                url.qdate = ts.toISOString()
                fs.writeFileSync(__dirname + '/../data/tmp/' + jobid + '.run.json', JSON.stringify(url), 'utf8')

            }, null, true, 'Europe/Paris');
        });
    }

    //--- Obtiens la liste des jobs a executer ------------------------------
    getJobIdsToRun() {

        // Liste les fichiers /tmp
        let files = fs.readdirSync(__dirname + '/../data/tmp/') 

        // Recup de la liste des runs et des reports
        var runs = []
        var reports = []
        files.forEach(function (file) {
            let fparts = file.split('.')
            switch (fparts[1]) {
                case 'run':
                    runs.push(fparts[0])
                    break;
                case 'report':
                    reports.push(fparts[0])
                    break;
            }
        });

        // Dedoublonage
        runs = runs.filter(function(elem, pos) {
            return runs.indexOf(elem) == pos;
        })
        reports = reports.filter(function(elem, pos) {
            return reports.indexOf(elem) == pos;
        })

        // Suppression des run ayant deja des reports
        reports.forEach(function (jobid) {
            let index = runs.indexOf(jobid);
            if (index > -1) {
                runs.splice(index, 1);
            }
        })  
        
        return runs
    }

    //--- Remove everything from queue ------------------------------
    emptyQueue() {
        let files = fs.readdirSync(__dirname + '/../data/tmp/')
        for (const file of files) {
            fs.unlinkSync(path.join(__dirname + '/../data/tmp/', file))
        }
    }

}

module.exports = QueueManager
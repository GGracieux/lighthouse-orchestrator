const fs = require('fs');
const QueueManager = require('./QueueManager.js')
const Lighthouse = require('./Lighthouse.js')
const mkdirp = require('mkdirp');

class Runner {

    //--- Initialisation ------------------------------
    constructor() {
        this.qm = new QueueManager()
        this.lighthouse = new Lighthouse()
        this.qm.emptyQueue()
        this.qm.startEnqueuer()
    }

    //--- Execution d'un test lightHouse ------------------------------
    runQueue() {

        let jobs = this.qm.getJobIdsToRun()
        if (jobs.length > 0) {
          
            this.lighthouse.runJob(jobs[0]).then(
                result => {
    
                    // Traite les resultats du test
                    this.handleJobResult(result)
    
                    // Lance le test suivant
                    this.runQueue()
                
                },
                err => {
                    let action = 'Erreur'
                    logger.error('Job ' + err.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + err.urlConf.url)
                    logger.error(JSON.stringify(err))
                }
            )
        } else {
            logger.info('Pas de test dans la queue, attente')
            setTimeout(this.runQueue.bind(this), 5000);
        }
    }

    //--- Traite les résultats d'un test lightHouse ------------------------------
    handleJobResult(jobResult) {

        let action = 'Extraction';
        logger.info('Job ' + jobResult.jobId + ' - ' + action.padEnd(10,' ') +  ' : ' + jobResult.urlConf.url)

        // lecture du rapport json
        let jsonReportPath = __dirname + '/../data/tmp/' + jobResult.jobId + '.report.json'
        let report = JSON.parse(fs.readFileSync(jsonReportPath, 'utf8'));

        // Extraction des données
        let line = report["fetchTime"]
        line += ';' + report["requestedUrl"]
        line += ';' + report["audits"]["first-contentful-paint"]["numericValue"] 
        line += ';' + report["audits"]["first-meaningful-paint"]["numericValue"]
        line += ';' + report["audits"]["speed-index"]["numericValue"]
        line += ';' + report["audits"]["first-cpu-idle"]["numericValue"]
        line += ';' + report["audits"]["interactive"]["numericValue"]
        line += ';' + report["audits"]["max-potential-fid"]["numericValue"]

        // Ecriture dans le log de resultat
        fs.appendFile(__dirname + '/../data/logs/results.log', line+"\n", function(err) {
            if(err) {
                return console.log(err);
            }
        });

        // Suppression du rapport json
        fs.unlinkSync(jsonReportPath)

        // Création du dossier de stockage du rapport html
        let d = new Date()
        let datePart = d.getFullYear() + '/' + d.getMonth().toString().padStart(2,0) + '/' + d.getDay().toString().padStart(2,0)
        let archiveDir = __dirname + '/../data/reports/' + datePart + '/'
        mkdirp.sync(archiveDir)

        // Déplacement du rapport html
        let htmlReportPath = __dirname + '/../data/tmp/' + jobResult.jobId + '.report.html'
        fs.renameSync(htmlReportPath, archiveDir + jobResult.jobId + '.report.html')

        // Supprime le run de la queue
        let runFilePath = __dirname + '/../data/tmp/' + jobResult.jobId + '.run.json'
        fs.unlinkSync(runFilePath)

        // Log
        action = 'Fin'
        logger.info('Job ' + jobResult.jobId  + ' - ' +  action.padEnd(10,' ') + ' : ' + jobResult.urlConf.url)
    }

    //--- Extrait les données d'un résultat de test lightHouse ------------------------------
    logJobData(jobId) {

    }

}

module.exports = Runner
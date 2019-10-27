// Dépendences
var fs = require('fs');

class Logger {

    //--- Initialisation ------------------------------
    constructor(path, stdOut) {
        this.path = path
        this.stdOut = stdOut
    }

    //--- Ecriture des logs ------------------------------
    write (eventType, message) {

        // Composition du message
        let logData = new Date().toISOString() + '|' + eventType + '|' + message

        // Sortie console
        if (this.stdOut) {
            console.log(logData)
        }

        // Sortie fichier
        if (this.path != '') {
            fs.appendFile(this.path, logData+"\n", function(err) {
                if(err) {
                    return console.log(err);
                }
            });
        }
    }

    //--- Wrapper : Info d'execution ------------------------------
    debug (message) {
        this.write('debug', message)
    }

    //--- Wrapper : Erreur lors de l'execution ------------------------------
    info (message) {
        this.write('info', message)
    }

    //--- Wrapper : Controle terminé sans alerte ------------------------------
    warn (message) {
        this.write('warn', message)
    }

    //--- Wrapper : Alerte lors d'un controle ------------------------------
    error (message) {
        this.write('error', message)
    }

}

module.exports = Logger
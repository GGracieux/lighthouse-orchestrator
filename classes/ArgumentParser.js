const ArgParser = require('argparse').ArgumentParser
const fs = require('fs')

class ArgumentParser
{
    //--- Initialisation ------------------------------
    constructor() {

        // reads npm version
        let npmConf = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));        
        
        // Init parser
        this.parser = new ArgParser({
            version: npmConf.version,
            addHelp:true,
            description: npmConf.description
        });

        // Add arguments
        this.parser.addArgument([ '--config-dir' ],{ 
            help: 'configuration directory',
            required: true
        });
        this.parser.addArgument([ '--data-dir' ],{ 
            help: 'data directory',
            required: true
        });
    }

    //--- Get args ------------------------------
    parseArgs() {
        return this.parser.parseArgs()
    }
}

module.exports = ArgumentParser
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
            metavar: '',
            defaultValue: "./",
            required: false
        });
        this.parser.addArgument([ '--data-dir' ],{
            help: 'data directory',
            metavar: '',
            defaultValue: "./data",
            required: false
        });
        this.parser.addArgument([ '--init-config' ],{
            help: 'outputs default configuration to config-dir',
            metavar: '',
            constant: true,
            action: 'storeConst',
            required: false
        });
        this.parser.addArgument([ '--init-profiles' ],{
            help: 'outputs default lighthouse profiles to config-dir',
            metavar: '',
            constant: true,
            action: 'storeConst',
            required: false
        });
    }

    //--- Get args ------------------------------
    parseArgs() {
        return this.parser.parseArgs()
    }
}

module.exports = ArgumentParser
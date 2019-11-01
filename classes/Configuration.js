const fs = require('fs')
const merge = require('deepmerge')

class Configuration
{
    //--- Loads configuration------------------------------
    load() {

        // loads default configuration
        let defaultConf = JSON.parse(fs.readFileSync(__dirname + '/../default-conf/lightkeeper.json', 'utf8'))

        // loads custom configuration if exists
        let customConf  = {}
        if (fs.existsSync(global.args.config_dir + '/lightkeeper.json')){
            customConf = JSON.parse(fs.readFileSync(global.args.config_dir + '/lightkeeper.json', 'utf8'))
        }

        // deepmerge
        const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray
        return merge(defaultConf, customConf, { arrayMerge: overwriteMerge })
    }

    //--- Returns profile path ------------------------------
    getProfilePath(profile) {
        let customPath = global.args.config_dir + '/profile.' + profile + '.json'
        let defaultPath = __dirname + '/../default-conf/profile.' + profile + '.json'
        return fs.existsSync(customPath) ? customPath : defaultPath
    }

    //--- Returns jobs path ------------------------------
    getJobsPath() {
        let customPath = global.args.config_dir + '/jobs.json'
        let defaultPath = __dirname + '/../default-conf/jobs.json'
        return fs.existsSync(customPath) ? customPath : defaultPath
    }

    //--- Copy default configuration to config-dir ------------------------------
    initConfig() {
        fs.copyFileSync(__dirname + '/../default-conf/lightkeeper.json', global.args.config_dir + '/lightkeeper.json')
        fs.copyFileSync(__dirname + '/../default-conf/jobs.json', global.args.config_dir + '/jobs.json')
    }

    //--- Copy default configuration to config-dir ------------------------------
    initProfiles() {
        fs.copyFileSync(__dirname + '/../default-conf/profile.desktop.json', global.args.config_dir + '/profile.desktop.json')
        fs.copyFileSync(__dirname + '/../default-conf/profile.mobile.json', global.args.config_dir + '/profile.mobile.json')
    }
}

module.exports = Configuration
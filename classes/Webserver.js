const express = require('express')
const basicAuth = require('express-basic-auth')
const favicon = require('serve-favicon');
const serveIndex = require('serve-index');
const glob = require('glob')
const path = require('path')
const https = require('https');
const fs = require('fs')

class Webserver {

    //--- Initialisation ------------------------------
    constructor() {

        this.app = express()

        // adds basic auth
        if (global.conf.webserver.authentication.enabled) {
            this.addBasicAuth()
        }

        // adds static directories
        global.conf.webserver.content.folders.forEach( folder => {
            this.addStaticDirectory('/' + folder, global.args.data_dir + '/' + folder )
        })

        // adds search
        if (global.conf.webserver.content.searchable) {
            this.addSearchById()
        }

        // adds homepage
        this.addHomePage()

    }

    //--- Adds basic auth to webserver access
    addBasicAuth() {
        this.app.use(basicAuth({
            users: global.conf.webserver.authentication.users,
            challenge: true
        }))
    }

    //--- Adds a static directory
    addStaticDirectory(virtualDir, webDir) {
        this.app.use(virtualDir, express.static(webDir));
        this.app.use(virtualDir, serveIndex(webDir, {
            icons: true ,
            view: "details"
        }));
    }

    //--- Adds search
    addSearchById() {
        this.app.get('/job', (req, res) => {

            // assembling search pattern
            let jobParts = req.query.id.split('-')
            let d = new Date(parseInt(jobParts[0]))
            let datePath = d.getFullYear() + '/' + (d.getMonth()+1).toString().padStart(2,0) + '/' + d.getDate().toString().padStart(2,0)
            let pattern = global.args.data_dir + '/reports/' + datePath + '/' + req.query.id + '*.' + req.query.format

            // searching
            let files = glob.sync(pattern)

            // serving
            if (files.length == 0) {
                res.status(404).send('Not found');
            } else if (files.length > 1) {
                res.status(404).send('Multiple match');
            } else {
                res.redirect(302, '/reports/' + datePath + '/' + path.basename(files[0]))
            }
        })
    }

    //--- Adds homepage
    addHomePage() {
        this.app.use(serveIndex(global.args.data_dir, {
            filter: function(filename) { return global.conf.webserver.content.folders.includes(filename) },
            icons: true,
            view: "details"
        }));
    }

    //--- Starts webserver on specific port and directory ------------------------------
    start(port) {

        this.app.use(favicon(__dirname + '/../assets/lightkeeper.ico'));

        if (global.conf.webserver.https.enabled) {
            https.createServer({
                key: fs.readFileSync( global.args.config_dir + '/' + global.conf.webserver.https.certificate.key ),
                cert: fs.readFileSync( global.args.config_dir + '/' + global.conf.webserver.https.certificate.crt )
            }, this.app).listen(port);
        } else {
            this.app.listen(port);
        }
    }

}

module.exports = Webserver
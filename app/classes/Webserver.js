var express = require('express')
var serveIndex = require('serve-index');
var app = express()

class Webserver {

    start() {
        app.use(express.static(__dirname + '/../data'));
        app.use(serveIndex(__dirname + '/../data'));
        app.listen(global.conf.webserver.port);
    }

}

module.exports = Webserver
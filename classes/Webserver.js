var express = require('express')
var serveIndex = require('serve-index');
var app = express()

class Webserver {

    //--- Starts webserver on specific port and directory ------------------------------
    start(directory, port) {
        app.use(express.static(directory));
        app.use(serveIndex(directory));
        app.listen(port);
    }

}

module.exports = Webserver
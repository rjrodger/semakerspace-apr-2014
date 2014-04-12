"use strict";


// core modules
var http  = require('http')

// third party modules
var express = require('express')
 

var app = express()
app.use( express.static(__dirname+'/public') )

var webserver = http.createServer(app)
webserver.listen(3000)

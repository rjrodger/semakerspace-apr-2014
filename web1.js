"use strict";


// core modules
var http  = require('http')
 

// third party modules
var WebSocketServer = require('ws').Server
var websocket       = require('websocket-stream')
var express         = require('express')



var app = express()
app.use( express.static(__dirname+'/public') )

var webserver = http.createServer(app)
webserver.listen(3000)

var wss = new WebSocketServer({server:webserver})
wss.on('connection', function(ws) {
  var ws_stream = websocket(ws)

  var counter = 0
  setInterval(function(){
    ws_stream.write(''+counter)
    counter++
  },1000)
})



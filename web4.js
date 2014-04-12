"use strict";


// core modules
var http  = require('http')
var net   = require('net')


// third party modules
var WebSocketServer = require('ws').Server
var websocket       = require('websocket-stream')
var es              = require('event-stream')
var express         = require('express')


var ws_stream
var cmd_stream


var app = express()
app.use( express.static(__dirname+'/public') )

var webserver = http.createServer(app)
webserver.listen(3000)

var wss = new WebSocketServer({server:webserver})
wss.on('connection', function(ws) {
  ws_stream = websocket(ws)
  connectpipe()
})


var netserver = net.createServer(function(connection) {
  cmd_stream = connection
  connectpipe()
})
netserver.listen(8124)



function connectpipe() { 
  if( ws_stream && cmd_stream ) {
    cmd_stream
      .pipe(ws_stream)
      .pipe(es.through(function(data){
        console.log(data.toString())
        this.queue(data)
      }))
      .pipe(cmd_stream)
  }
}


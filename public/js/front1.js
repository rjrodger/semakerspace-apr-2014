"use strict";

var stream    = require('stream')
var websocket = require('websocket-stream')
 

var body = document.getElementsByTagName('body')[0]

var logger = stream.Writable();
logger._write = function(data, enc, next) {
  body.innerHTML = body.innerHTML+data+'<br>'
  next()
}


var ws = websocket('ws://localhost:3000',[])
ws.pipe(logger)

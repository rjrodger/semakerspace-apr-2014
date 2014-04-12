"use strict";

var stream    = require('stream')
var websocket = require('websocket-stream')


var canvas = new fabric.Canvas('tracker',{ selection: false });
fabric.Object.prototype.originX = 'center'
fabric.Object.prototype.originY = 'center'

var size   = 400

var state = {
  last:[(size/2),(size/2)]
}


var logger = stream.Writable();
logger._write = function(data, enc, next) {
  try {
    data = JSON.parse(data)
  }
  catch(e) {
    console.log(e,''+data)
    data = {}
  }

  if( 'loc' == data.name ) {
    var x = (size/2) + data.x
    var y = (size/2) + (-1*data.y)

    canvas.add(makeLine( state.last.concat([x,y]) ))

    triangle.set({
      left:  x,
      top:   y,
      angle: data.state.heading,
      fill:  data.state.backled ? '#00f':'#008'
    }).bringToFront()

    canvas.renderAll()

    state.last = [x,y]
  }
  else if( 'reset' == data.name ) {
    canvas.clear()

    triangle.set({
      left:  (size/2),
      top:   (size/2),
      angle: data.state.heading,
      fill:  data.state.backled ? '#00f':'#008'
    }).bringToFront()

    canvas.renderAll()

    state.last = [(size/2),(size/2)]
  }

  next()
}


var ws = websocket('ws://localhost:3000',[])
ws.pipe(logger)


function pushkey(k,s) { 
  return function(){
    s.push(JSON.stringify({cmd:'key',key:{name:k}})) 
  } 
}

var keystream = stream.Readable()
keystream._read = function(){}

key('c',     pushkey('c',     keystream))
key('b',     pushkey('b',     keystream))
key('up',    pushkey('up',    keystream))
key('down',  pushkey('down',  keystream))
key('left',  pushkey('left',  keystream))
key('right', pushkey('right', keystream))
key('q',     pushkey('q',     keystream))

keystream.pipe(ws)

 



function makeLine(coords) {
  return new fabric.Line(coords, {
    fill:        'red',
    stroke:      'red',
    strokeWidth: 5
  })
}

var triangle = new fabric.Triangle({
  width:  20, 
  height: 30, 
  fill:   '#00f', 
  left:   (size/2), 
  top:    (size/2)
})

canvas.add(triangle)

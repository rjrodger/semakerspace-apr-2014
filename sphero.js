"use strict";


// core modules
var stream = require('stream')
var util   = require('util')
var net    = require('net')


// third party modules
var es         = require('event-stream')
var keypress   = require('keypress')
var roundRobot = require('node-sphero')



process.stdin.setRawMode(true)
process.stdin.resume()
keypress(process.stdin)


var keypresser = new stream.Duplex({objectMode:true})
keypresser._read = function(){}
keypresser._write = function(data,end,done) {
  this.push(data)
  done()
}


process.stdin.on('keypress', function (ch,key) {
  keypresser.push( {ch:ch,key:key} )
})



var keyparser = new stream.Transform({objectMode:true})
keyparser._transform = function(keypress, enc, done) {
  var self = this

  keypress = keypress || {}

  var ch  = keypress.ch
  var key = keypress.key

  var cmd = {name:'noop'}

  if( key ) {
    if( key.ctrl && 'c' == key.name ) {
      cmd.name = 'die'
    }
    else if( 'c' == key.name ) {
      cmd.name = 'reset'
      cmd.rgb  = makecolor()
      cmd.loc  = [0,0]
    }

    if( 'b'     == key.name ) { cmd.name = 'toggle-backled' }
    if( 'right' == key.name ) { cmd.name = 'right' }
    if( 'left'  == key.name ) { cmd.name = 'left' }
    if( 'up'    == key.name ) { cmd.name = 'roll' }
    if( 'down'  == key.name ) { cmd.name = 'stop' }
    if( 'q'     == key.name ) { cmd.name = 'die' }
  }
  else if( ch ) {
    if( ',' == ch ) { cmd.name = 'slower' }
    if( '.' == ch ) { cmd.name = 'faster' }
  }

  self.push(cmd)
  done()
}



var killer = es.through(function(cmd){
  if( 'die' == cmd.name ) {
    process.exit()
  }
  else this.queue( cmd );
})




util.inherits(Controller, stream.Transform)

function Controller(opt) {
  var self = this

  self._heading = 0
  self._speed   = 0.3
  self._backled = true

  opt = opt || {}
  opt.objectMode = true
  stream.Transform.call(this, opt)
}

Controller.prototype._transform = function(cmd, enc, done) {
  var self = this

  if( 'toggle-backled' == cmd.name ) { 
    self._backled = !self._backled
  }

  if( 'right' == cmd.name ) { self._heading = (self._heading+15)%360 }
  if( 'left'  == cmd.name ) { self._heading = (360+self._heading-15)%360 }

  var speed = self._speed
  if( 'slower' == cmd.name ) { speed -= 0.1; speed = speed < 0.1 ? 0.1 : speed; } 
  if( 'faster' == cmd.name ) { speed += 0.1; speed = speed > 1.0 ? 1.0 : speed; } 
  self._speed = speed

  cmd.state = {
    heading: self._heading,
    speed:   self._speed,
    backled: self._backled
  }

  self.push(cmd)
  done()
}



function makecolor(){
  var r = ~~(Math.random()*255);
  var g = ~~(Math.random()*255);
  var b = ~~(Math.random()*255);
  return [r,g,b];
}

function die(err) {
  if( err ) return process.exit( !console.error(err) );
}



var client = net.connect({port: 8124})
client.on('error',die)


var controller = new Controller()



var sphero = new roundRobot.Sphero();
var sphero_id = process.argv[2]
if( !sphero_id ) die('no sphero id')




var sphero_events = new stream.Duplex({objectMode:true})

sphero_events._read = function() {}
sphero_events._write = function(cmd, enc, done) {
  this.push(cmd)
  done()
}


util.inherits(SpheroDrive, stream.Duplex)

function SpheroDrive(sphero,ball,opt) {
  var self = this

  opt = opt || {}
  opt.objectMode = true
  stream.Duplex.call(this, opt)

  self._sphero = sphero
  self._ball   = ball
}

SpheroDrive.prototype._read = function() {}

SpheroDrive.prototype._write = function(cmd, enc, done) {
  var sphero = this._sphero
  var ball   = this._ball

  if( 'reset' == cmd.name ) {
    sphero.setRGBLED(cmd.rgb[0], cmd.rgb[1], cmd.rgb[2], false);
    ball.configureLocator(true,0,0,0,die)
  }

  if( 'toggle-backled' == cmd.name) { sphero.setBackLED( cmd.state.backled?1:0 ) }

  if( 'right' == cmd.name ) { sphero.roll( cmd.state.heading, 0) }
  if( 'left'  == cmd.name ) { sphero.roll( cmd.state.heading, 0) }

  if( 'roll'   == cmd.name ) { sphero.roll(cmd.state.heading, cmd.state.speed) }
  if( 'stop' == cmd.name )   { sphero.roll(cmd.state.heading, 0) }

  if( 'die' == cmd.name ) { sphero.close() }

  this.push(cmd)
  done()
}



console.log('connecting...')
sphero.connect( sphero_id )
sphero.on("error",die)

sphero.on("connected", function(ball){
  ball.setStabilization(true);
    
  ball.configureLocator(true,0,0,0,die)

  ball.setDataStreaming( 
    [ ball.sensors.locator_x, ball.sensors.locator_y, ],
    10,
    1,0,
    die
  )
  
  var rgb = makecolor()
  sphero.setRGBLED(rgb[0], rgb[1], rgb[2], false);
  sphero.setBackLED(1);
  

  ball.on('notification',function(out){
    if( 0x03 == out.ID_CODE && out.DATA ) {
      var x = ( out.DATA.readInt16BE(0) ) / 2
      var y = ( out.DATA.readInt16BE(2) ) / 2
      sphero_events.push( {name:'loc',x:x, y:y} )
    }
  })


  var sphero_drive = new SpheroDrive(sphero,ball)


  console.log("Connected!");
  console.log("  c - change color and reset location");
  console.log("  b - backled on/off");
  console.log("  , - reduce move 1/10th");
  console.log("  . - increase move 1/10th");
  console.log("  up - move forward");
  console.log("  back - stop");
  console.log("  left - change heading 15 deg left");
  console.log("  right - change heading 15 deg right\n\n");

 
  var locprinter = es.through(function(cmd){
    if( 'loc' == cmd.name ) {
      console.log('\x1b[F'+
                  '                                                     '+
                  '\x1b[0GLocation: '+cmd.x+', '+cmd.y+'\x1b[0m  Move: '+Math.round(10*cmd.state.speed))
    }
    this.queue(cmd)
  })


  var outstream = keypresser
        .pipe(keyparser)
        .pipe(sphero_events)
        .pipe(killer)
        .pipe(controller)
        .pipe(sphero_drive)
        .pipe(locprinter)
        .pipe(es.stringify())
        .pipe(client)

  client
    .pipe(es.parse())
    .pipe(keypresser)

})



